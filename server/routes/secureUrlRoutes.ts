import express from 'express';
import { generateSecureDownloadUrl, generateSecureUploadUrl } from '../controllers/secureUrlController';
import { isAuthenticated } from '../middleware/authMiddleware';

const router = express.Router();

// URL segura para download
router.get('/download', isAuthenticated, generateSecureDownloadUrl);

// URL segura para upload
router.post('/upload', isAuthenticated, generateSecureUploadUrl);

export default router;
