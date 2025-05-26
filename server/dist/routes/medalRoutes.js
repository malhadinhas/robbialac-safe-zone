"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.medalRoutes = void 0;
exports.setMongoClient = setMongoClient;
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const router = express_1.default.Router();
let mongoClient;
function setMongoClient(client) {
    mongoClient = client;
}
// Listar todas as medalhas
router.get('/', async (req, res) => {
    try {
        const db = mongoClient.db();
        const medals = await db.collection('medals').find().toArray();
        res.json(medals);
    }
    catch (error) {
        console.error('Erro ao buscar medalhas:', error);
        res.status(500).json({ error: 'Erro ao buscar medalhas' });
    }
});
// Buscar medalhas de um usuário específico
router.get('/user/:userId', async (req, res) => {
    try {
        const db = mongoClient.db();
        const user = await db.collection('users').findOne({
            _id: new mongodb_1.ObjectId(req.params.userId)
        });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        const medals = await db.collection('medals')
            .find({
            _id: { $in: user.medals?.map(id => new mongodb_1.ObjectId(id)) || [] }
        })
            .toArray();
        res.json(medals);
    }
    catch (error) {
        console.error('Erro ao buscar medalhas do usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar medalhas do usuário' });
    }
});
// Atribuir medalha a um usuário
router.post('/award/:userId/:medalId', async (req, res) => {
    try {
        const db = mongoClient.db();
        const result = await db.collection('users').updateOne({ _id: new mongodb_1.ObjectId(req.params.userId) }, {
            $addToSet: {
                medals: new mongodb_1.ObjectId(req.params.medalId),
                medalAcquisitions: {
                    medalId: new mongodb_1.ObjectId(req.params.medalId),
                    acquiredDate: new Date()
                }
            }
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Medalha atribuída com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atribuir medalha:', error);
        res.status(500).json({ error: 'Erro ao atribuir medalha' });
    }
});
exports.medalRoutes = router;
