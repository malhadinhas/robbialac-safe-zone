"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentRoutes = void 0;
exports.setMongoClient = setMongoClient;
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
let mongoClient;
function setMongoClient(client) {
    mongoClient = client;
}
// Listar todos os departamentos
router.get('/', async (req, res) => {
    try {
        const db = mongoClient.db();
        const departments = await db.collection('departments').find().toArray();
        res.json(departments);
    }
    catch (error) {
        console.error('Erro ao buscar departamentos:', error);
        res.status(500).json({ error: 'Erro ao buscar departamentos' });
    }
});
exports.departmentRoutes = router;
