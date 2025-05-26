import { Collection, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UserModel, { IUser } from '../models/User';
import logger from '../utils/logger';
import { User } from '../types';
import { connectToDatabase } from './database';
import LoginEvent from '../models/LoginEvent';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

// Tipo seguro para retorno de autenticação
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  points: number;
  level: number;
  medals: string[];
  viewedVideos: string[];
  reportedIncidents: string[];
  verificationCode?: string;
  isVerified?: boolean;
  avatarUrl?: string;
};

interface JwtPayload {
  userId: string;
  role: string;
}

export async function validateCredentials(email: string, password: string): Promise<AuthenticatedUser | null> {
  // ---- REMOVER DEBUG LOGS DIRETOS ---- 
  // console.log(`[validateCredentials - Direct Log] Received Email: ${email}`);
  // console.log(`[validateCredentials - Direct Log] Received Password: ${password}`); 
  // ---- FIM REMOVER DEBUG LOGS DIRETOS ----

  logger.info('[validateCredentials] Attempting login for:', { email });
  logger.info('[validateCredentials] Password received (length):', password ? password.length : 'undefined/empty');
  
  try {
    const user = await UserModel.findOne({ email });

    if (!user) {
      logger.warn('[validateCredentials] User not found in DB', { email });
      return null;
    }
    
    logger.info('[validateCredentials] User found in DB:', { userId: user.id, userEmail: user.email });
    logger.info('[validateCredentials] Stored password hash:', user.password); 

    // ---- REMOVER DEBUG LOG DIRETO --- 
    // console.log(`[validateCredentials - Direct Log] Stored Hash: ${user.password}`);
    // ---- FIM REMOVER DEBUG LOG DIRETO ---

    const isValid = await bcrypt.compare(password, user.password); 
    
    logger.info('[validateCredentials] bcryptjs.compare result:', { isValid }); 
        
    if (!isValid) {
      logger.warn('Tentativa de login falhou: Senha inválida (bcryptjs compare returned false)', { email });
      return null;
    }

    // Login bem-sucedido, registar evento
    try {
      await LoginEvent.create({
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date(),
        // ipAddress: req?.ip, // TODO: Passar req para obter IP
        // userAgent: req?.headers['user-agent'] // TODO: Passar req para obter User Agent
      });
      logger.info('Evento de login registado com sucesso', { userId: user.id, email: user.email });
    } catch (logError: unknown) {
      // Não impedir o login se o registo do evento falhar, apenas logar o erro
      logger.error('Falha ao registar evento de login', { userId: user.id, email: user.email, error: logError instanceof Error ? logError.message : String(logError) });
    }

    // Não retornar o hash da senha
    const { password: _, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as AuthenticatedUser;
  } catch (error: unknown) {
    logger.error('Erro durante validação de credenciais', { email, error: error instanceof Error ? error.message : String(error) });
    throw error; // Re-lança o erro para ser tratado pela rota
  }
}

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'default-secret', {
    expiresIn: '24h',
  });
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as JwtPayload;
  } catch (error) {
    logger.error('Erro ao verificar token:', { error });
    throw new Error('Token inválido');
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export async function createUser(userData: Omit<IUser, 'id' | 'password'> & { password: string }): Promise<IUser> {
  try {
    // Verificar se o email já existe
    const existingUser = await UserModel.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(userData.password);

    const newUser: IUser = {
      id: new Date().getTime().toString(), // Pode ser substituído por um UUID
      ...userData,
      password: hashedPassword
    };

    const created = await UserModel.create(newUser);
    const userObj = created.toObject() as Partial<IUser>;

    // Não retornar o hash da senha
    const { password: _, ...userWithoutPassword } = userObj;
    return userWithoutPassword as IUser;
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

export async function validateToken(token: string): Promise<boolean> {
  try {
    const decoded = await verifyToken(token);
    if (!decoded) {
      return false;
    }
    const user = await UserModel.findOne({ id: decoded.userId });
    return !!user;
  } catch (error) {
    return false;
  }
} 