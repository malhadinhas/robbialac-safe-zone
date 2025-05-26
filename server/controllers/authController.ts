import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from '../services/email';

// Armazenamento temporário em memória para códigos de verificação (em produção, usar Redis ou BD)
const pendingVerifications = new Map<string, { name: string; password: string; verificationCode: string; createdAt: number }>();

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    logger.error('Erro ao fazer login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
}

export async function sendVerificationCode(req: Request, res: Response): Promise<void> {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    return;
  }
  if (!email.endsWith('@robbialac.pt')) {
    res.status(400).json({ error: 'Só são permitidos emails @robbialac.pt' });
    return;
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400).json({ error: 'Email já cadastrado' });
    return;
  }
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  pendingVerifications.set(email, { name, password, verificationCode, createdAt: Date.now() });
  await sendVerificationEmail(email, verificationCode);
  res.json({ message: 'Código de verificação enviado para seu email' });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Email já cadastrado' });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    logger.error('Erro ao registrar usuário:', error);
    res.status(500).json({ message: 'Erro ao registrar usuário' });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { email, code } = req.body;
  if (!email || !code) {
    res.status(400).json({ error: 'Email e código são obrigatórios' });
    return;
  }
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }
  if (user.isVerified) {
    res.status(400).json({ error: 'Usuário já verificado' });
    return;
  }
  if (user.verificationCode !== code) {
    res.status(400).json({ error: 'Código de verificação inválido' });
    return;
  }
  await User.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationCode: '' } });
  res.json({ message: 'Email verificado com sucesso!' });
} 