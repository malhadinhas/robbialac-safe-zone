import express from 'express';
import {
  getUserRanking,
} from '../controllers/statsController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware global
router.use(isAuthenticated);

// Obter ranking dos utilizadores
router.get('/ranking', getUserRanking);

export default router;
