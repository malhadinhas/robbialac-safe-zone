import { Router } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import {
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  getUserByIdHandler,
  updateUserRoleHandler
} from '../controllers/userController';
import { hasRole } from '../middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const router = Router();

// Listar todos os usuários
router.get('/', listUsers);

// Obter usuário por ID
router.get('/:id', getUserByIdHandler);

// Criar um novo usuário
router.post('/', createUser);

// Atualizar um usuário
router.put('/:id', updateUser);

// Excluir um usuário
router.delete('/:id', deleteUser);

// Atualizar o role de um usuário (apenas admin_app)
router.patch('/:id/role', hasRole(['admin_app']), updateUserRoleHandler);

export default router; 