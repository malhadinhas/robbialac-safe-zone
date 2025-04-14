import { Router } from 'express';
import { getUserPointsBreakdown, getUserRanking } from '../controllers/statsController';

const router = Router();

// Obter distribuição de pontos do usuário por categoria
router.get('/user/:userId/points-breakdown', getUserPointsBreakdown);

// Obter ranking do usuário
router.get('/user/:userId/ranking', getUserRanking);

export default router; 