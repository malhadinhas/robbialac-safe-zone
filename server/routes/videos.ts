import express from 'express';
import {
  createVideo,
  deleteVideo,
  getVideoById,
  getVideos,
  getLastViewedVideosByCategory
} from '../controllers/videoController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';
import {upload} from '../middleware/uploadMiddleware';

const router = express.Router();

// Middleware global
router.use(isAuthenticated);

// Upload de novo vídeo (apenas admins)
router.post('/upload', isAdmin, upload.single('video'), createVideo);

// Listar todos os vídeos
router.get('/', getVideos);

// Obter vídeo por ID
router.get('/:id', getVideoById);

// Remover vídeo (apenas admins)
router.delete('/:id', isAdmin, deleteVideo);

// Obter últimos vídeos vistos por categoria
router.get('/category/:category/most-viewed', getLastViewedVideosByCategory);

export default router;

