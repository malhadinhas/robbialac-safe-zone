"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middleware/authMiddleware");
const interactionController_1 = require("../controllers/interactionController");
const router = (0, express_1.Router)();
// Middleware de autenticação para todas as rotas de interação
router.use(authMiddleware_1.isAuthenticated);
// Rotas disponíveis
router.post('/like', interactionController_1.addLike);
router.post('/comment', interactionController_1.addComment);
exports.default = router;
