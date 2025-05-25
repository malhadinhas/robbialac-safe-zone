"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const videoController_1 = require("../controllers/videoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = (0, express_1.Router)();
// Middleware de log
router.use((req, res, next) => {
    console.log(`[ROUTE LOG] ${req.method} ${req.originalUrl} chegou em /api/videos`);
    next();
});
// Upload de vídeo
router.post('/upload', authMiddleware_1.isAuthenticated, uploadMiddleware_1.uploadVideo, videoController_1.createVideo);
// Listar vídeos
router.get('/', authMiddleware_1.isAuthenticated, videoController_1.getVideos);
// Obter vídeo por ID
router.get('/:id', authMiddleware_1.isAuthenticated, videoController_1.getVideoById);
// Deletar vídeo (apenas admin)
router.delete('/:id', authMiddleware_1.isAuthenticated, authMiddleware_1.isAdmin, videoController_1.deleteVideo);
// Vídeos mais vistos por categoria
router.get('/category/:category/most-viewed', authMiddleware_1.isAuthenticated, videoController_1.getLastViewedVideosByCategory);
exports.default = router;
