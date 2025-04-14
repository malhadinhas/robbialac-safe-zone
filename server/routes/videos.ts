import { Router } from 'express';
import {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementVideoViews,
  getLastViewedVideosByCategory
} from '../controllers/videoController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';
import { uploadVideo, validateUploadedVideo, handleUploadError } from '../middleware/uploadMiddleware';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

const router = Router();

// Criar diretórios necessários
const dirs = [
  path.join(process.cwd(), 'uploads'),
  path.join(process.cwd(), 'uploads', 'thumbnails'),
  path.join(process.cwd(), 'uploads', 'processed'),
  path.join(process.cwd(), 'temp')
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Diretório criado: ${dir}`);
  }
}

// Rotas públicas
router.get('/', getVideos);
router.get('/:id', getVideoById);
router.get('/category/:category/most-viewed', getLastViewedVideosByCategory);
router.post('/category/:category/next', getLastViewedVideosByCategory);

// Rota de upload - removido isAdmin temporariamente para testes
router.post('/', 
  uploadVideo,
  handleUploadError,
  validateUploadedVideo,
  createVideo
);

// Rotas que requerem autenticação
router.use(isAuthenticated);
router.post('/:id/views', incrementVideoViews);

// Rotas que requerem privilégios de admin
router.use(isAdmin);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);

export default router; 