import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
} from '../controllers/incidentController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// Listar todos os incidentes
router.get('/', getIncidents);

// Buscar um incidente específico
router.get('/:id', getIncidentById);

// Criar um novo incidente (requer autenticação)
router.post('/', isAuthenticated, createIncident);

// Atualizar um incidente (requer autenticação)
router.put('/:id', isAuthenticated, updateIncident);

// Excluir um incidente (requer privilégios de administrador)
router.delete('/:id', isAdmin, deleteIncident);

export default router; 