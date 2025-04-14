import { Router } from 'express';
import { getMedals, getUserMedals, getUserUnacquiredMedals } from '../controllers/medalController';

const router = Router();

// Listar todas as medalhas
router.get('/', getMedals);

// Buscar medalhas de um usuário específico
router.get('/user/:userId', getUserMedals);

// Buscar medalhas não conquistadas por um usuário
router.get('/user/:userId/unacquired', getUserUnacquiredMedals);

export default router; 