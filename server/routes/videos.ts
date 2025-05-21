import { Router } from 'express';
import {
  createVideo,
  getVideos,
  getVideoById,
  deleteVideo,
  getLastViewedVideosByCategory
} from '../controllers/videoController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';
import { uploadVideo } from '../middleware/uploadMiddleware';

const router = Router();

// Middleware de log
router.use((req, res, next) => {
  console.log(`[ROUTE LOG] ${req.method} ${req.originalUrl} chegou em /api/videos`);
  next();
});

// Upload de vídeo
router.post('/upload', isAuthenticated, uploadVideo, createVideo);

// Listar vídeos
router.get('/', isAuthenticated, getVideos);

// Obter vídeo por ID
router.get('/:id', isAuthenticated, getVideoById);

// Deletar vídeo (apenas admin)
router.delete('/:id', isAuthenticated, isAdmin, deleteVideo);

// Vídeos mais vistos por categoria
router.get('/category/:category/most-viewed', isAuthenticated, getLastViewedVideosByCategory);

export default router; 