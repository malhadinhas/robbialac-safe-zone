"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sensibilizacaoController_1 = require("../controllers/sensibilizacaoController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Configuração do multer para upload de arquivos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos PDF são permitidos'));
        }
    },
});
// Middleware de autenticação para todas as rotas
router.use(authMiddleware_1.isAuthenticated);
// Rotas para documentos de sensibilização
// Permitir que qualquer usuário autenticado visualize documentos (sem restrição de role)
router.get('/', sensibilizacaoController_1.getSensibilizacoes);
router.get('/:id', sensibilizacaoController_1.getSensibilizacaoById);
// Manter restrições para operações de modificação
router.post('/', (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), upload.single('document'), sensibilizacaoController_1.createSensibilizacao);
router.put('/:id', (0, authMiddleware_1.hasRole)(['admin_qa']), upload.single('document'), sensibilizacaoController_1.updateSensibilizacao);
router.delete('/:id', (0, authMiddleware_1.hasRole)(['admin_qa']), sensibilizacaoController_1.deleteSensibilizacao);
exports.default = router;
