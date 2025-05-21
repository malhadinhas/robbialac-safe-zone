"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const incidentController_1 = require("../controllers/incidentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Nova rota para incidentes recentes (DEVE VIR ANTES de /:incidentId)
router.get('/recent', authMiddleware_1.isAuthenticated, (req, res) => { (0, incidentController_1.getRecentIncidents)(req, res); });
// GET /api/incidents - Listar incidentes (com filtro de status opcional)
router.get('/', authMiddleware_1.isAuthenticated, (req, res) => { (0, incidentController_1.getIncidents)(req, res); });
// GET /api/incidents/by-department - Listar por departamento (com filtro de ano opcional)
router.get('/by-department', authMiddleware_1.isAuthenticated, (req, res) => { (0, incidentController_1.getIncidentsByDepartment)(req, res); });
// POST /api/incidents - Criar novo incidente (requer autenticação)
router.post('/', authMiddleware_1.isAuthenticated, (req, res) => { (0, incidentController_1.createIncident)(req, res); });
// GET /api/incidents/:incidentId - Obter incidente específico
router.get('/:incidentId', authMiddleware_1.isAuthenticated, (req, res) => { (0, incidentController_1.getIncidentById)(req, res); });
// PUT /api/incidents/:incidentId - Atualizar incidente (requer autenticação e papel admin ou qa)
router.put('/:incidentId', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_app', 'admin_qa']), (req, res) => { (0, incidentController_1.updateIncident)(req, res); });
// DELETE /api/incidents/:incidentId - Apagar incidente permanentemente (requer privilégios de administrador)
router.delete('/:incidentId', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), (req, res) => { (0, incidentController_1.deleteIncident)(req, res); });
// Nova rota para incidentes recentes
// Adicionar getRecentIncidents ao import do controlador acima quando for criado
// router.get('/recent', authenticateToken, getRecentIncidents);
exports.default = router;
