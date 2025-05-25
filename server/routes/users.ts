import { Router } from 'express';
import User from '../models/User';
import logger from '../utils/logger';
import {
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import { hasRole } from '../middleware/authMiddleware';
import { ObjectId } from 'mongodb';

const router = Router();

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({ message: 'Erro ao listar usuários' });
  }
});

// Obter usuário por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    logger.error('Erro ao obter usuário:', error);
    res.status(500).json({ message: 'Erro ao obter usuário' });
  }
});

// Buscar um usuário por email
router.get('/email/:email', getUserByEmail);

// Criar um novo usuário
router.post('/', createUser);

// Atualizar um usuário
router.put('/:id', updateUser);

// Excluir um usuário
router.delete('/:id', deleteUser);

// Atualizar o role de um usuário (apenas admin_app)
router.patch('/:id/role', hasRole(['admin_app']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  console.log('Alterando role do utilizador:', { id, role });
  if (!['admin_app', 'admin_qa', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido' });
  }
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    user.role = role;
    await user.save();
    res.json({ message: 'Role atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

export default router; 