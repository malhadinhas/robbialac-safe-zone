"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const interactionController_1 = require("../controllers/interactionController");
const router = (0, express_1.Router)();
// Middleware de autenticação para todas as rotas de interação
router.use(authMiddleware_1.isAuthenticated);
// --- Rotas de Likes ---
// POST /api/interactions/like - Dar like a um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao' }
router.post('/like', interactionController_1.addLike);
// DELETE /api/interactions/like - Remover like de um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao' }
router.delete('/like', interactionController_1.removeLike);
// GET /api/interactions/like/:itemType/:itemId - Info de likes
router.get('/like/:itemType/:itemId', interactionController_1.getLikeInfo);
// --- Rotas de Comentários ---
// POST /api/interactions/comment - Adicionar comentário a um item
// Body: { itemId: string, itemType: 'qa' | 'accident' | 'sensibilizacao', text: string }
router.post('/comment', interactionController_1.addComment);
// GET /api/interactions/comment/:itemType/:itemId - Buscar comentários de um item
router.get('/comment/:itemType/:itemId', interactionController_1.getCommentsByItem);
exports.default = router;
