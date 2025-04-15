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

// Rota de upload - nenhuma autenticação requerida para testes
router.post('/', 
  (req, res, next) => {
    logger.info('Iniciando upload de vídeo', {
      headers: req.headers,
      contentType: req.headers['content-type']
    });
    next();
  },
  uploadVideo,
  validateUploadedVideo,
  createVideo
);

// Rotas que requerem autenticação (desabilitadas temporariamente)
// router.use(isAuthenticated);
router.post('/:id/views', incrementVideoViews);

// Rotas que requerem privilégios de admin (desabilitadas temporariamente)
// router.use(isAdmin);
router.put('/:id', updateVideo);
router.delete('/:id', deleteVideo);

export default router; 