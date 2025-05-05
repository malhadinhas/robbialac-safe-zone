import { Router, Request, Response } from 'express';
import { validateCredentials, generateToken } from '../services/auth';
import logger from '../utils/logger';

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

// TODO: Adicionar rota para validar token (ex: /validate-token)
// TODO: Adicionar rota para refresh token (se necessário)

export default router; 