import { Router } from 'express';
import { getMedals, getUserMedals, getUserUnacquiredMedals, assignMedalToUser } from '../controllers/medalController';

const router = Router();

// Listar todas as medalhas
router.get('/', getMedals);

// Buscar medalhas de um usuário específico
router.get('/user/:userId', getUserMedals);

// Buscar medalhas não conquistadas por um usuário
router.get('/user/:userId/unacquired', getUserUnacquiredMedals);

// Atribuir manualmente uma medalha a um usuário
router.post('/assign/:userId/:medalId', assignMedalToUser);

export default router; 