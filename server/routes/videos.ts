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

const router = Router();

// Listar todos os vídeos
router.get('/', getVideos);

// Buscar vídeos mais visualizados por categoria
router.get('/category/:category/most-viewed', getLastViewedVideosByCategory);

// Buscar um vídeo específico
router.get('/:id', getVideoById);

// Criar um novo vídeo (requer privilégios de administrador)
router.post('/', isAdmin, createVideo);

// Atualizar um vídeo (requer privilégios de administrador)
router.put('/:id', isAdmin, updateVideo);

// Excluir um vídeo (requer privilégios de administrador)
router.delete('/:id', isAdmin, deleteVideo);

// Incrementar visualizações (requer autenticação)
router.post('/:id/views', isAuthenticated, incrementVideoViews);

export default router; 