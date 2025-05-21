"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const activityController_1 = require("../controllers/activityController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Registrar uma nova atividade (requer autenticação)
router.post('/', authMiddleware_1.isAuthenticated, activityController_1.registerActivity);
// Obter atividades de um usuário (requer autenticação)
// Se for o próprio usuário ou um admin que está solicitando
router.get('/user/:userId', authMiddleware_1.isAuthenticated, activityController_1.getUserActivities);
// --- Feed Unificado --- 
// GET /api/activities/feed - Obter feed de atividades recentes unificado
router.get('/feed', authMiddleware_1.isAuthenticated, activityController_1.getFeed);
exports.default = router;
