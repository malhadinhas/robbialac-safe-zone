import { Router } from 'express';
import {
  getUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController';
import { hasRole } from '../middleware/authMiddleware';
import { ObjectId } from 'mongodb';
import { getCollection } from '../services/database';

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

// Atualizar o role de um usuário (apenas admin_app)
router.patch('/:id/role', hasRole(['admin_app']), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  console.log('Alterando role do utilizador:', { id, role });
  if (!['admin_app', 'admin_qa', 'user'].includes(role)) {
    return res.status(400).json({ error: 'Role inválido' });
  }
  try {
    const collection = await getCollection('users');
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (e) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    const result = await collection.updateOne({ _id: objectId }, { $set: { role } });
    console.log('Resultado do updateOne:', result);
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json({ message: 'Role atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

export default router; 