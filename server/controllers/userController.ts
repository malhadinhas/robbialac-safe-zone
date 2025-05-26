import { Request, Response } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import { isValidObjectId } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/express';

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find().select('-password').lean();
    logger.info(`Usuários recuperados: ${users.length}`);
    res.json(users);
  } catch (error: unknown) {
    logger.error('Erro ao recuperar usuários:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      message: 'Erro ao recuperar usuários',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      logger.warn('Tentativa de acesso com ID inválido', { id });
      res.status(400).json({ message: 'ID de usuário inválido' });
      return;
    }

    const user = await User.findById(id).select('-password').lean();
    
    if (!user) {
      logger.warn('Usuário não encontrado', { id });
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    logger.info('Usuário encontrado', { id });
    res.json(user);
  } catch (error) {
    logger.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro ao obter usuário' });
  }
}

export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      logger.warn('Tentativa de criar usuário com dados incompletos');
      res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn('Tentativa de criar usuário com email já existente', { email });
      res.status(400).json({ message: 'Email já cadastrado' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    logger.info('Usuário criado com sucesso', { id: user._id });
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    if (!isValidObjectId(id)) {
      logger.warn('Tentativa de atualizar usuário com ID inválido', { id });
      res.status(400).json({ message: 'ID de usuário inválido' });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      logger.warn('Usuário não encontrado para atualização', { id });
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        logger.warn('Tentativa de atualizar email para um já existente', { email });
        res.status(400).json({ message: 'Email já cadastrado' });
        return;
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    logger.info('Usuário atualizado com sucesso', { id });
    res.json({
      message: 'Usuário atualizado com sucesso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      logger.warn('Tentativa de excluir usuário com ID inválido', { id });
      res.status(400).json({ message: 'ID de usuário inválido' });
      return;
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      logger.warn('Usuário não encontrado para exclusão', { id });
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    logger.info('Usuário excluído com sucesso', { id });
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir usuário:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Tentativa de login com dados incompletos');
      res.status(400).json({ message: 'Email e senha são obrigatórios' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn('Tentativa de login com email não cadastrado', { email });
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Tentativa de login com senha incorreta', { email });
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );

    logger.info('Login realizado com sucesso', { id: user._id });
    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    logger.error('Erro ao realizar login:', error);
    res.status(500).json({ message: 'Erro ao realizar login' });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.warn('Tentativa de obter usuário atual sem autenticação');
      res.status(401).json({ message: 'Não autorizado' });
      return;
    }

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      logger.warn('Usuário atual não encontrado', { id: userId });
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    logger.info('Usuário atual recuperado com sucesso', { id: userId });
    res.json(user);
  } catch (error) {
    logger.error('Erro ao obter usuário atual:', error);
    res.status(500).json({ message: 'Erro ao obter usuário atual' });
  }
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Erro ao listar usuários:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
}

export async function getUserByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }
    res.json(user);
  } catch (error) {
    logger.error('Erro ao obter usuário:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ message: 'Erro ao obter usuário' });
  }
}

export async function updateUserRoleHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { role } = req.body;
  if (!['admin_app', 'admin_qa', 'user'].includes(role)) {
    res.status(400).json({ error: 'Role inválido' });
    return;
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    user.role = role;
    await user.save();
    res.json({ message: 'Role atualizado com sucesso' });
  } catch (error) {
    logger.error('Erro ao atualizar role:', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
}

// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de utilizadores para a API.
// Permite: listar, obter, criar, atualizar e eliminar utilizadores na base de dados.
// Cada função trata de um endpoint RESTful e faz validação básica e logging.
// O objetivo é centralizar toda a lógica de manipulação de utilizadores neste módulo. 