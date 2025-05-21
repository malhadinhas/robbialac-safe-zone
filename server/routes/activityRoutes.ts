import { Router } from 'express';
import {
  registerActivity,
  getUserActivities,
  getFeed
} from '../controllers/activityController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Registrar uma nova atividade (requer autenticação)
router.post('/', isAuthenticated, registerActivity);

// Obter atividades de um usuário (requer autenticação)
// Se for o próprio usuário ou um admin que está solicitando
router.get('/user/:userId', isAuthenticated, getUserActivities);

// --- Feed Unificado --- 
// GET /api/activities/feed - Obter feed de atividades recentes unificado
router.get('/feed', isAuthenticated, getFeed);

router.use((req, res, next) => {
  console.log(`[ROUTE LOG] ${req.method} ${req.originalUrl} chegou em /api/activities`);
  next();
});

export default router; 