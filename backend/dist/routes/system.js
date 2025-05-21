"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const systemController_1 = require("../controllers/systemController");
const router = (0, express_1.Router)();
// Buscar configuração do sistema
router.get('/config', systemController_1.getSystemConfig);
exports.default = router;
