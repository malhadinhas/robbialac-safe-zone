"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medalController_1 = require("../controllers/medalController");
// Middleware de autenticação/autorização
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Rotas Públicas (ou protegidas por autenticação geral)
router.get('/', medalController_1.getMedals);
router.get('/user/:userId', authMiddleware_1.isAuthenticated, medalController_1.getUserMedals);
router.get('/user/:userId/unacquired', authMiddleware_1.isAuthenticated, medalController_1.getUserUnacquiredMedals);
// Rota para Atribuição Manual (protegida por admin)
router.post('/assign/:userId/:medalId', authMiddleware_1.isAdmin, medalController_1.assignMedalToUser);
// --- NOVAS ROTAS CRUD (protegidas por admin) ---
router.post('/', authMiddleware_1.isAdmin, medalController_1.createMedal);
router.put('/:medalId', authMiddleware_1.isAdmin, medalController_1.updateMedal);
router.delete('/:medalId', authMiddleware_1.isAdmin, medalController_1.deleteMedal);
// -----------------------------------------------
exports.default = router;
