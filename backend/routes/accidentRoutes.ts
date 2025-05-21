import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import {
  createAccident,
  getAccidents,
  getAccidentById,
  updateAccident,
  deleteAccident
} from '../controllers/accidentController';
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
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await isAuthenticated(req, res, next);
  } catch (error) {
    next(error);
  }
};

router.use(authMiddleware);

// Rotas para acidentes (documentos)
// Permitir que qualquer usuário autenticado visualize acidentes
router.get('/', getAccidents);
router.get('/:id', getAccidentById);

// Manter restrições para operações de modificação
router.post('/', hasRole(['admin_qa', 'admin_app']), upload.single('document'), createAccident);
router.put('/:id', hasRole(['admin_qa', 'admin_app']), upload.single('document'), updateAccident);
router.delete('/:id', hasRole(['admin_qa']), deleteAccident); // Apenas admin_qa pode excluir

export default router; 