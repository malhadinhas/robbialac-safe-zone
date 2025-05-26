import express from 'express';
import {
  getZoneStats,
  getZoneStatsById
} from '../controllers/zoneController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware global de autenticação
router.use(isAuthenticated);

// Obter estatísticas globais por zona
router.get('/', getZoneStats);

// Obter estatísticas por ID de zona
router.get('/:zoneId/stats', getZoneStatsById);

export default router;
