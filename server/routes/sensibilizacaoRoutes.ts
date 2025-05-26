import express, { RequestHandler } from 'express';
import {
  createSensibilizacao,
  getSensibilizacoes,
} from '../controllers/sensibilizacaoController';
import { upload } from '../middleware/uploadMiddleware'; // <- CORRIGIDO
import { isAuthenticated, hasRole } from '../middleware/authMiddleware';

const router = express.Router();

// Middleware global
router.use(isAuthenticated);

// Obter todas as sensibilizações
router.get('/', getSensibilizacoes);

// Criar nova sensibilização
router.post(
  '/',
  hasRole(['admin_qa', 'admin_app']) as RequestHandler,
  upload.single('document'),
  createSensibilizacao
);

export default router;
