import { Router } from 'express';
import { getUserPointsBreakdown, getUserRanking, getLeaderboard } from '../controllers/statsController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = Router();

// Obter distribuição de pontos do usuário por categoria
router.get('/user/:userId/points-breakdown', getUserPointsBreakdown);

// Obter ranking do usuário
router.get('/user/:userId/ranking', getUserRanking);

// Obter leaderboard geral
router.get('/leaderboard', getLeaderboard);

export default router; 