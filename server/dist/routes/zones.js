"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zoneController_1 = require("../controllers/zoneController");
const router = (0, express_1.Router)();
// Listar estatísticas de todas as zonas
router.get('/stats', zoneController_1.getZoneStats);
// Buscar estatísticas de uma zona específica
router.get('/:zoneId/stats', zoneController_1.getZoneStatsById);
// Buscar estatísticas de categorias
router.get('/categories/stats', zoneController_1.getCategoryStats);
exports.default = router;
