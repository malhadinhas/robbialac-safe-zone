"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const accidentController_1 = require("../controllers/accidentController");
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
// Rotas para acidentes (documentos)
// Permitir que qualquer usuário autenticado visualize acidentes
router.get('/', accidentController_1.getAccidents);
router.get('/:id', accidentController_1.getAccidentById);
// Manter restrições para operações de modificação
router.post('/', (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), upload.single('document'), accidentController_1.createAccident);
router.put('/:id', (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), upload.single('document'), accidentController_1.updateAccident);
router.delete('/:id', (0, authMiddleware_1.hasRole)(['admin_qa']), accidentController_1.deleteAccident); // Apenas admin_qa pode excluir
exports.default = router;
