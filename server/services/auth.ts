import { Collection, ObjectId } from 'mongodb';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getCollection } from './database';
import logger from '../utils/logger';
import { User, LoginEvent } from '../types';

interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  points: number;
  level: number;
  medals: string[];
  viewedVideos: string[];
  reportedIncidents: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;

export async function validateCredentials(email: string, password: string): Promise<User | null> {
  // ---- REMOVER DEBUG LOGS DIRETOS ---- 
  // console.log(`[validateCredentials - Direct Log] Received Email: ${email}`);
  // console.log(`[validateCredentials - Direct Log] Received Password: ${password}`); 
  // ---- FIM REMOVER DEBUG LOGS DIRETOS ----

  logger.info('[validateCredentials] Attempting login for:', { email });
  logger.info('[validateCredentials] Password received (length):', password ? password.length : 'undefined/empty');
  
  try {
    const usersCollection = await getCollection<User>('users');
    const user = await usersCollection.findOne({ email });

    if (!user) {
      logger.warn('[validateCredentials] User not found in DB', { email });
      return null;
    }
    
    logger.info('[validateCredentials] User found in DB:', { userId: user.id, userEmail: user.email });
    logger.info('[validateCredentials] Stored password hash:', user.password); 

    // ---- REMOVER DEBUG LOG DIRETO --- 
    // console.log(`[validateCredentials - Direct Log] Stored Hash: ${user.password}`);
    // ---- FIM REMOVER DEBUG LOG DIRETO ---

    const isValid = await bcryptjs.compare(password, user.password); 
    
    logger.info('[validateCredentials] bcryptjs.compare result:', { isValid }); 
        
    if (!isValid) {
      logger.warn('Tentativa de login falhou: Senha inválida (bcryptjs compare returned false)', { email });
      return null;
    }

    // Login bem-sucedido, registar evento
    try {
      const loginEventsCollection = await getCollection<LoginEvent>('loginEvents');
      const newLoginEvent: Omit<LoginEvent, '_id'> = {
        userId: user.id,
        userEmail: user.email,
        timestamp: new Date(),
        // ipAddress: req?.ip, // TODO: Passar req para obter IP
        // userAgent: req?.headers['user-agent'] // TODO: Passar req para obter User Agent
      };
      await loginEventsCollection.insertOne(newLoginEvent as LoginEvent);
      logger.info('Evento de login registado com sucesso', { userId: user.id, email: user.email });
    } catch (logError: any) {
      // Não impedir o login se o registo do evento falhar, apenas logar o erro
      logger.error('Falha ao registar evento de login', { userId: user.id, email: user.email, error: logError.message });
    }

    // Não retornar o hash da senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error: any) {
    logger.error('Erro durante validação de credenciais', { email, error: error.message });
    throw error; // Re-lança o erro para ser tratado pela rota
  }
}

export function generateToken(user: Omit<User, 'password'>): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export async function verifyToken(token: string): Promise<{ id: string; email: string; role: string } | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

export async function createUser(userData: Omit<User, 'id' | 'password'> & { password: string }): Promise<User> {
  try {
    const collection: Collection<User> = await getCollection<User>('users');
    
    // Verificar se o email já existe
    const existingUser = await collection.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await hashPassword(userData.password);

    const newUser: User = {
      id: new Date().getTime().toString(), // Pode ser substituído por um UUID
      ...userData,
      password: hashedPassword
    };

    await collection.insertOne(newUser);

    // Não retornar o hash da senha
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword as User;
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

    const collection: Collection<User> = await getCollection<User>('users');
    const user = await collection.findOne({ id: decoded.id });

    return !!user;
  } catch (error) {
    return false;
  }
} 