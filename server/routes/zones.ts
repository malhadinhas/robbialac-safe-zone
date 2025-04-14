import { Router } from 'express';
import { getZoneStats, getZoneStatsById, getCategoryStats } from '../controllers/zoneController';

const router = Router();

// Listar estatísticas de todas as zonas
router.get('/stats', getZoneStats);

// Buscar estatísticas de uma zona específica
router.get('/:zoneId/stats', getZoneStatsById);

// Buscar estatísticas de categorias
router.get('/categories/stats', getCategoryStats);

export default router; 