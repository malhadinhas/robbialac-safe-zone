import { Router } from 'express';
import { getUserPointsBreakdown } from '../controllers/statsController';

const router = Router();

// Obter distribuição de pontos do usuário por categoria
router.get('/user/:userId/points-breakdown', getUserPointsBreakdown);

export default router; 