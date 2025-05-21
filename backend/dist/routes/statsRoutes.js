"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const statsController_1 = require("../controllers/statsController");
const router = (0, express_1.Router)();
// Obter distribuição de pontos do usuário por categoria
router.get('/user/:userId/points-breakdown', statsController_1.getUserPointsBreakdown);
// Obter ranking do usuário
router.get('/user/:userId/ranking', statsController_1.getUserRanking);
// Obter leaderboard geral
router.get('/leaderboard', statsController_1.getLeaderboard);
exports.default = router;
