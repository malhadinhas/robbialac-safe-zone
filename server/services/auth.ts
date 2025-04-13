import { Collection } from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getCollection } from './database';

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
  try {
    const collection: Collection<User> = await getCollection<User>('users');
    const user = await collection.findOne({ email });

    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    // Não retornar o hash da senha
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Erro ao validar credenciais:', error);
    throw error;
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
  return bcrypt.hash(password, SALT_ROUNDS);
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