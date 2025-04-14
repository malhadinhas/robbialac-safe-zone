import { Router } from 'express';
import { registerActivity, getUserActivities } from '../controllers/activityController';

const router = Router();

// Registrar uma nova atividade
router.post('/', registerActivity);

// Obter atividades de um usuário
router.get('/user/:userId', getUserActivities);

export default router; 