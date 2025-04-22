import { Router } from 'express';
import { isAuthenticated } from '../middleware/authMiddleware';
import {
  addLike,
  removeLike,
  addComment,
  getCommentsByItem
} from '../controllers/interactionController';

const router = Router();

// Middleware de autenticação para todas as rotas de interação
router.use(isAuthenticated);

// --- Rotas de Likes ---

// POST /api/interactions/like - Dar like a um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao' }
router.post('/like', addLike); 

// DELETE /api/interactions/like - Remover like de um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao' }
router.delete('/like', removeLike);

// --- Rotas de Comentários ---

// POST /api/interactions/comment - Adicionar comentário a um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao', text: string }
router.post('/comment', addComment);

// GET /api/interactions/comment/:itemType/:itemId - Buscar comentários de um item
router.get('/comment/:itemType/:itemId', getCommentsByItem);

export default router; 