"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Middleware de proteção para todas as rotas de analytics
router.use(authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_app']));
/**
 * Rota para obter dados analíticos básicos.
 */
router.get('/basic', analyticsController_1.getBasicAnalytics);
/**
 * Rota para obter estatísticas de login.
 * Query param: groupBy=day|week|month|year (default: day)
 */
router.get('/logins', analyticsController_1.getLoginStats);
/**
 * Rota para obter estatísticas de upload.
 * Query param: groupBy=day|week|month|year (default: day)
 */
router.get('/uploads', analyticsController_1.getUploadStats);
/**
 * Rota para obter logs de erro.
 * Query params: limit (default: 50), page (default: 1)
 */
router.get('/errors', analyticsController_1.getErrorLogs);
// TODO: Adicionar mais rotas para dados analíticos específicos
exports.default = router;
