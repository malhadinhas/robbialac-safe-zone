import { Router } from 'express';
import { registerActivity, getUserActivities } from '../controllers/activityController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Registrar uma nova atividade (requer autenticação)
router.post('/', isAuthenticated, registerActivity);

// Obter atividades de um usuário (requer autenticação)
// Se for o próprio usuário ou um admin que está solicitando
router.get('/user/:userId', isAuthenticated, getUserActivities);

export default router; 