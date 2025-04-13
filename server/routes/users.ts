import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';

const router = Router();

// Listar todos os usuários
router.get('/', getUsers);

// Buscar um usuário específico por ID
router.get('/:id', getUserById);

// Buscar um usuário por email
router.get('/email/:email', getUserByEmail);

// Criar um novo usuário
router.post('/', createUser);

// Atualizar um usuário
router.put('/:id', updateUser);

// Excluir um usuário
router.delete('/:id', deleteUser);

export default router; 