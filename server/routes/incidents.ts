import { Router } from 'express';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
} from '../controllers/incidentController';

const router = Router();

// Listar todos os incidentes
router.get('/', getIncidents);

// Buscar um incidente específico
router.get('/:id', getIncidentById);

// Criar um novo incidente
router.post('/', createIncident);

// Atualizar um incidente
router.put('/:id', updateIncident);

// Excluir um incidente
router.delete('/:id', deleteIncident);

export default router; 