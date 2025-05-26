"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const videoController_1 = require("../controllers/videoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = express_1.default.Router();
// Middleware global
router.use(authMiddleware_1.isAuthenticated);
// Upload de novo vídeo (apenas admins)
router.post('/upload', authMiddleware_1.isAdmin, uploadMiddleware_1.upload.single('video'), videoController_1.createVideo);
// Listar todos os vídeos
router.get('/', videoController_1.getVideos);
// Obter vídeo por ID
router.get('/:id', videoController_1.getVideoById);
// Remover vídeo (apenas admins)
router.delete('/:id', authMiddleware_1.isAdmin, videoController_1.deleteVideo);
// Obter últimos vídeos vistos por categoria
router.get('/category/:category/most-viewed', videoController_1.getLastViewedVideosByCategory);
exports.default = router;
