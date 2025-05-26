import { Router } from 'express';
import { isAuthenticated } from '../middleware/authMiddleware';
import {
  addLike,
  addComment,
  // remover estas três funções que não estão implementadas/exportadas
  // removeLike,
  // getCommentsByItem,
  // getLikeInfo
} from '../controllers/interactionController';

const router = Router();

// Middleware de autenticação para todas as rotas de interação
router.use(isAuthenticated);

// Rotas disponíveis
router.post('/like', addLike); 
router.post('/comment', addComment);

export default router;
