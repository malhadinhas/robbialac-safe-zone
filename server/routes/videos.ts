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

const router = Router();

// Listar todos os vídeos
router.get('/', getVideos);

// Buscar vídeos mais visualizados por categoria
router.get('/category/:category/most-viewed', getLastViewedVideosByCategory);

// Buscar um vídeo específico
router.get('/:id', getVideoById);

// Criar um novo vídeo
router.post('/', createVideo);

// Atualizar um vídeo
router.put('/:id', updateVideo);

// Excluir um vídeo
router.delete('/:id', deleteVideo);

// Incrementar visualizações
router.post('/:id/views', incrementVideoViews);

export default router; 