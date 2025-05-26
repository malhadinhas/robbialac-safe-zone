"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zoneController_1 = require("../controllers/zoneController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Middleware global de autenticação
router.use(authMiddleware_1.isAuthenticated);
// Obter estatísticas globais por zona
router.get('/', zoneController_1.getZoneStats);
// Obter estatísticas por ID de zona
router.get('/:zoneId/stats', zoneController_1.getZoneStatsById);
exports.default = router;
