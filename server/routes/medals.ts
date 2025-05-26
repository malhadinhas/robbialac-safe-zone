import express from 'express';
import {
  getAllMedals,
  assignMedalToUser,
} from '../controllers/medalController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Obter todas as medalhas
router.get('/', isAuthenticated, getAllMedals);

// Atribuir medalha a um utilizador
router.post(
  '/assign/:userId/:medalId',
  isAuthenticated,
  async (req, res) => {
    const { userId, medalId } = req.params;
    try {
      await assignMedalToUser(userId, medalId);
      res.status(200).json({ message: 'Medalha atribuída com sucesso.' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atribuir medalha.' });
    }
  }
);

export default router;
