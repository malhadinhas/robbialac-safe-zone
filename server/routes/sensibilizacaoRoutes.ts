import express from 'express';
import multer from 'multer';
import {
  createSensibilizacao,
  getSensibilizacoes,
  getSensibilizacaoById,
  updateSensibilizacao,
  deleteSensibilizacao
} from '../controllers/sensibilizacaoController';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware';

const router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

// Middleware de autenticação para todas as rotas
router.use(isAuthenticated);

// Rotas para documentos de sensibilização
router.get('/', hasRole(['admin_qa', 'admin_app']), getSensibilizacoes);
router.get('/:id', hasRole(['admin_qa', 'admin_app']), getSensibilizacaoById);
router.post('/', hasRole(['admin_qa']), upload.single('document'), createSensibilizacao);
router.put('/:id', hasRole(['admin_qa']), upload.single('document'), updateSensibilizacao);
router.delete('/:id', hasRole(['admin_qa']), deleteSensibilizacao);

export default router; 