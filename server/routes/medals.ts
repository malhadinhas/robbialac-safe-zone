import express from 'express';
import {
  getMedals,
  getUserMedals,
  getUserUnacquiredMedals,
  assignMedalToUser,
  createMedal,
  updateMedal,
  deleteMedal
} from '../controllers/medalController';

// Middleware de autenticação/autorização
import { isAdmin, isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Rotas Públicas (ou protegidas por autenticação geral)
router.get('/', getMedals);
router.get('/user/:userId', isAuthenticated, getUserMedals);
router.get('/user/:userId/unacquired', isAuthenticated, getUserUnacquiredMedals);

// Rota para Atribuição Manual (protegida por admin)
router.post('/assign/:userId/:medalId', isAdmin, assignMedalToUser);

// --- NOVAS ROTAS CRUD (protegidas por admin) ---
router.post('/', isAdmin, createMedal);
router.put('/:medalId', isAdmin, updateMedal);
router.delete('/:medalId', isAdmin, deleteMedal);
// -----------------------------------------------

export default router; 