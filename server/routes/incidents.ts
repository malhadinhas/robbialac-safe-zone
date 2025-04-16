import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentsByDepartment
} from '../controllers/incidentController';
import { isAuthenticated, isAdmin } from '../middleware/authMiddleware';

const router = Router();

// GET /api/incidents - Listar incidentes (com filtro de status opcional)
router.get('/', getIncidents);

// GET /api/incidents/by-department - Listar por departamento (com filtro de ano opcional)
router.get('/by-department', getIncidentsByDepartment);

// POST /api/incidents - Criar novo incidente (requer autenticação)
router.post('/', isAuthenticated, createIncident);

// GET /api/incidents/:incidentId - Obter incidente específico
router.get('/:incidentId', getIncidentById);

// PUT /api/incidents/:incidentId - Atualizar incidente (requer autenticação)
router.put('/:incidentId', isAuthenticated, updateIncident);

// DELETE /api/incidents/:incidentId - Apagar incidente permanentemente (requer privilégios de administrador)
router.delete('/:incidentId', isAdmin, deleteIncident);

export default router;