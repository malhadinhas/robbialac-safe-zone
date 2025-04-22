import { Router } from 'express';
import {
  getVideos,
  getVideoById,
  createVideo,
  updateVideo,
  deleteVideo,
  incrementVideoViews,
  getLastViewedVideosByCategory,
  getRecentVideos
} from '../controllers/videoController';
import { isAuthenticated, isAdmin, hasRole } from '../middleware/authMiddleware';
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

// --- Rotas mais específicas PRIMEIRO ---

// GET /api/videos/recent - Listar vídeos recentes
router.get('/recent', isAuthenticated, getRecentVideos);

// GET /api/videos/category/:category/most-viewed - Listar últimos visualizados por categoria
router.get('/category/:category/most-viewed', isAuthenticated, getLastViewedVideosByCategory);

// POST /api/videos/category/:category/next - Ação parece duplicada, remover ou verificar
// router.post('/category/:category/next', isAuthenticated, getLastViewedVideosByCategory);

// --- Rotas genéricas e outras ---

// GET /api/videos - Listar todos os vídeos prontos
router.get('/', getVideos);

// GET /api/videos/:id - Obter vídeo específico (Rota genérica DEPOIS das específicas)
router.get('/:id', isAuthenticated, getVideoById);

// POST /api/videos - Criar novo vídeo (com upload via Middleware)
router.post(
  '/', 
  isAuthenticated, 
  uploadVideo,
  validateUploadedVideo,
  createVideo
);

// PUT /api/videos/:id - Atualizar vídeo (requer admin ou qa)
router.put('/:id', isAuthenticated, hasRole(['admin_app', 'admin_qa']), updateVideo);

// DELETE /api/videos/:id - Apagar vídeo (requer admin)
router.delete('/:id', isAuthenticated, isAdmin, deleteVideo);

// POST /api/videos/:id/views - Incrementar visualizações
// Verificar se esta rota ainda é necessária ou se a lógica foi movida
// router.post('/:id/views', isAuthenticated, incrementVideoViews);

export default router; 