import express from 'express';
import {
  getBasicAnalytics,
  getLoginStats,
  getUploadStats,
  getErrorLogs
} from '../controllers/analyticsController';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware de proteção para todas as rotas de analytics
router.use(isAuthenticated, hasRole(['admin_app']));

/**
 * Rota para obter dados analíticos básicos.
 */
router.get('/basic', getBasicAnalytics);

/**
 * Rota para obter estatísticas de login.
 * Query param: groupBy=day|week|month|year (default: day)
 */
router.get('/logins', getLoginStats);

/**
 * Rota para obter estatísticas de upload.
 * Query param: groupBy=day|week|month|year (default: day)
 */
router.get('/uploads', getUploadStats);

/**
 * Rota para obter logs de erro.
 * Query params: limit (default: 50), page (default: 1)
 */
router.get('/errors', getErrorLogs);

// TODO: Adicionar mais rotas para dados analíticos específicos

export default router; 