"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const incidentController_1 = require("../controllers/incidentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use((req, res, next) => {
    console.log(`[ROUTE LOG] ${req.method} ${req.originalUrl} chegou em /api/incidents`);
    next();
});
// Nova rota para incidentes recentes (DEVE VIR ANTES de /:incidentId)
router.get('/recent', authMiddleware_1.isAuthenticated, incidentController_1.getRecentIncidents);
// GET /api/incidents - Listar incidentes (com filtro de status opcional)
router.get('/', authMiddleware_1.isAuthenticated, incidentController_1.getIncidents);
// GET /api/incidents/by-department - Listar por departamento (com filtro de ano opcional)
router.get('/by-department', incidentController_1.getIncidentsByDepartment);
// POST /api/incidents - Criar novo incidente (requer autenticação)
router.post('/', authMiddleware_1.isAuthenticated, incidentController_1.createIncident);
// GET /api/incidents/:incidentId - Obter incidente específico
router.get('/:incidentId', authMiddleware_1.isAuthenticated, incidentController_1.getIncidentById);
// PUT /api/incidents/:incidentId - Atualizar incidente (requer autenticação e papel admin ou qa)
router.put('/:incidentId', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_app', 'admin_qa']), incidentController_1.updateIncident);
// DELETE /api/incidents/:incidentId - Apagar incidente permanentemente (requer privilégios de administrador)
router.delete('/:incidentId', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), incidentController_1.deleteIncident);
// Nova rota para incidentes recentes
// Adicionar getRecentIncidents ao import do controlador acima quando for criado
// router.get('/recent', authenticateToken, getRecentIncidents);
exports.default = router;
