import { Router } from 'express';
import { getSystemConfig } from '../controllers/systemController';

const router = Router();

// Buscar configuração do sistema
router.get('/config', getSystemConfig);

export default router; 