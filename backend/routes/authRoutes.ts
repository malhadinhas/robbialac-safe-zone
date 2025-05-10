import { Router, Request, Response } from 'express';
import { validateCredentials, generateToken } from '../services/auth';
import logger from '../utils/logger';
import { createUser } from '../controllers/userController';
import { getCollection } from '../services/database';
import { sendVerificationEmail } from '../services/email';
import { hashPassword } from '../utils/passwordUtils';
import crypto from 'crypto';

const router = Router();

/**
 * Rota para login de utilizador.
 * Recebe email e password no corpo da requisição.
 * Retorna dados do utilizador (sem password) e token JWT em caso de sucesso.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    logger.warn('Tentativa de login sem email ou password');
    return res.status(400).json({ message: 'Email e password são obrigatórios' });
  }

  try {
    // Validar credenciais
    const user = await validateCredentials(email, password);

    if (!user) {
      logger.warn('Falha na autenticação (validateCredentials retornou null)', { email });
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token JWT
    const token = generateToken(user);
    
    logger.info('Login bem-sucedido e token gerado', { userId: user.id, email: user.email });

    // Remover _id do utilizador antes de devolver
    const { _id, ...userWithoutMongoId } = user;

    // Retornar dados do utilizador e token
    res.json({ user: userWithoutMongoId, token });

  } catch (error: any) {
    logger.error('Erro durante o processo de login na rota /api/auth/login', { 
      email: email, 
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Erro interno no servidor durante o login' });
  }
});

// Armazenamento temporário em memória para códigos de verificação (em produção, use Redis ou banco)
const pendingVerifications = new Map();

// Endpoint para enviar código de verificação
router.post('/send-code', async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }
  if (!email.endsWith('@robbialac.pt')) {
    return res.status(400).json({ error: 'Só são permitidos emails @robbialac.pt' });
  }
  // Verifica se já existe usuário com esse email
  const collection = await getCollection('users');
  const existingUser = await collection.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ error: 'Email já cadastrado' });
  }
  // Gerar código de verificação
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Salvar temporariamente os dados
  pendingVerifications.set(email, { name, password, verificationCode, createdAt: Date.now() });
  // Enviar email
  await sendVerificationEmail(email, verificationCode);
  res.json({ message: 'Código de verificação enviado para seu email' });
});

// Endpoint para criar usuário após verificação
router.post('/register', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email e código são obrigatórios' });
  }
  const pending = pendingVerifications.get(email);
  if (!pending) {
    return res.status(400).json({ error: 'Solicite um novo código de verificação' });
  }
  if (pending.verificationCode !== code) {
    return res.status(400).json({ error: 'Código de verificação inválido' });
  }
  // Criar usuário
  const collection = await getCollection('users');
  const hashedPassword = await hashPassword(pending.password);
  const newUser = {
    email,
    password: hashedPassword,
    name: pending.name,
    id: crypto.randomUUID(),
    points: 100,
    level: 1,
    medals: [],
    viewedVideos: [],
    reportedIncidents: [],
    isVerified: true
  };
  await collection.insertOne(newUser);
  pendingVerifications.delete(email);
  // Gerar token JWT
  const token = generateToken(newUser);
  res.status(201).json({ message: 'Usuário criado com sucesso', user: newUser, token });
});

// Endpoint para verificação de email
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email e código são obrigatórios' });
  }
  const collection = await getCollection('users');
  const user = await collection.findOne({ email });
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado' });
  }
  if (user.isVerified) {
    return res.status(400).json({ error: 'Usuário já verificado' });
  }
  if (user.verificationCode !== code) {
    return res.status(400).json({ error: 'Código de verificação inválido' });
  }
  await collection.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationCode: '' } });
  res.json({ message: 'Email verificado com sucesso!' });
});

// TODO: Adicionar rota para validar token (ex: /validate-token)
// TODO: Adicionar rota para refresh token (se necessário)

export default router; 