import express from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getIncidentsByDepartment,
  getRecentIncidents
} from '../controllers/incidentController';
import { isAuthenticated, isAdmin, hasRole } from '../middleware/authMiddleware';

const router = express.Router();

// Nova rota para incidentes recentes (DEVE VIR ANTES de /:incidentId)
router.get('/recent', isAuthenticated, getRecentIncidents);

// GET /api/incidents - Listar incidentes (com filtro de status opcional)
router.get('/', isAuthenticated, getIncidents);

// GET /api/incidents/by-department - Listar por departamento (com filtro de ano opcional)
router.get('/by-department', getIncidentsByDepartment);

// POST /api/incidents - Criar novo incidente (requer autenticação)
router.post('/', isAuthenticated, createIncident);

// GET /api/incidents/:incidentId - Obter incidente específico
router.get('/:incidentId', isAuthenticated, getIncidentById);

// PUT /api/incidents/:incidentId - Atualizar incidente (requer autenticação e papel admin ou qa)
router.put('/:incidentId', isAuthenticated, hasRole(['admin_app', 'admin_qa']), updateIncident);

// DELETE /api/incidents/:incidentId - Apagar incidente permanentemente (requer privilégios de administrador)
router.delete('/:incidentId', isAuthenticated, isAdmin, deleteIncident);

// Nova rota para incidentes recentes
// Adicionar getRecentIncidents ao import do controlador acima quando for criado
// router.get('/recent', authenticateToken, getRecentIncidents);

export default router;