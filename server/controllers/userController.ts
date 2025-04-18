import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import { User } from '../types';
import { hashPassword } from '../services/auth';
import logger from '../utils/logger';

export async function getUsers(req: Request, res: Response) {
  try {
    const collection = await getCollection<User>('users');
    const users = await collection.find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const collection = await getCollection<User>('users');
    const user = await collection.findOne({ id });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

export async function getUserByEmail(req: Request, res: Response) {
  try {
    const { email } = req.params;
    const collection = await getCollection<User>('users');
    const user = await collection.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, ...restData } = req.body;

    if (!email || !password) {
      logger.warn('Tentativa de criar utilizador sem email ou password');
      return res.status(400).json({ error: 'Email e password são obrigatórios' });
    }

    const collection = await getCollection<User>('users');
    
    // Verificar se o email já existe
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      logger.warn('Tentativa de criar utilizador com email já existente', { email });
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Fazer hash da password
    const hashedPassword = await hashPassword(password);
    
    const newUser: User = {
      email,
      password: hashedPassword,
      ...restData,
      id: crypto.randomUUID(),
      points: 100,
      level: 1,
      medals: [],
      viewedVideos: [],
      reportedIncidents: []
    };
    
    await collection.insertOne(newUser);
    logger.info('Novo utilizador criado com sucesso', { email });
    
    // Retornar utilizador sem a password
    const { password: _, ...userToReturn } = newUser;
    res.status(201).json(userToReturn);

  } catch (error: any) {
    logger.error('Erro ao criar utilizador', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Erro ao criar utilizador' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const collection = await getCollection<User>('users');
    
    const result = await collection.updateOne(
      { id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const collection = await getCollection<User>('users');
    
    const result = await collection.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    res.status(500).json({ error: 'Erro ao excluir usuário' });
  }
} 