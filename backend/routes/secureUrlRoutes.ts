import { Router } from 'express';
import { generateSecureUrl } from '../controllers/secureUrlController';
import { isAuthenticated } from '../middleware/authMiddleware'; // Proteger o endpoint

const router = Router();

// GET /api/secure-url?key=<objectKey>
// Retorna uma URL assinada para a chave R2 fornecida
router.get('/', isAuthenticated, generateSecureUrl);

export default router; 