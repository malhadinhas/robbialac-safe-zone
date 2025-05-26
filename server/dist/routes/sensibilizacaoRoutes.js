"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sensibilizacaoController_1 = require("../controllers/sensibilizacaoController");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware"); // <- CORRIGIDO
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Middleware global
router.use(authMiddleware_1.isAuthenticated);
// Obter todas as sensibilizações
router.get('/', sensibilizacaoController_1.getSensibilizacoes);
// Criar nova sensibilização
router.post('/', (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), uploadMiddleware_1.upload.single('document'), sensibilizacaoController_1.createSensibilizacao);
exports.default = router;
