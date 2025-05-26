"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRoutes = void 0;
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const mongoService_1 = require("../services/mongoService");
const cloudflareR2Service_1 = require("../services/cloudflareR2Service");
const router = express_1.default.Router();
// GET /api/videos - Listar todos os vídeos
router.get('/', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const videos = await db.collection('videos').find({}).toArray();
        res.json(videos.map(video => ({
            ...video,
            id: video._id.toString()
        })));
    }
    catch (error) {
        console.error('Erro ao buscar vídeos:', error);
        res.status(500).json({ error: 'Erro ao buscar vídeos' });
    }
});
// GET /api/videos/:id - Buscar um vídeo específico
router.get('/:id', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const video = await db.collection('videos').findOne({
            _id: new mongodb_1.ObjectId(req.params.id)
        });
        if (!video) {
            return res.status(404).json({ error: 'Vídeo não encontrado' });
        }
        res.json({
            ...video,
            id: video._id.toString()
        });
    }
    catch (error) {
        console.error('Erro ao buscar vídeo:', error);
        res.status(500).json({ error: 'Erro ao buscar vídeo' });
    }
});
// POST /api/videos/:id/views - Incrementar visualizações
router.post('/:id/views', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const result = await db.collection('videos').updateOne({ _id: new mongodb_1.ObjectId(req.params.id) }, {
            $inc: { views: 1 },
            $set: { lastViewed: new Date() }
        });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Vídeo não encontrado' });
        }
        res.json({ message: 'Visualizações incrementadas com sucesso' });
    }
    catch (error) {
        console.error('Erro ao incrementar visualizações:', error);
        res.status(500).json({ error: 'Erro ao incrementar visualizações' });
    }
});
// GET /api/videos/category/:category/last-viewed - Buscar últimos vídeos vistos por categoria
router.get('/category/:category/last-viewed', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const limit = parseInt(req.query.limit) || 5;
        const videos = await db.collection('videos')
            .find({ category: req.params.category })
            .sort({ lastViewed: -1 })
            .limit(limit)
            .toArray();
        res.json(videos.map(video => ({
            ...video,
            id: video._id.toString()
        })));
    }
    catch (error) {
        console.error('Erro ao buscar últimos vídeos:', error);
        res.status(500).json({ error: 'Erro ao buscar últimos vídeos' });
    }
});
// POST /api/videos/category/:category/next - Buscar próximo vídeo para assistir
router.post('/category/:category/next', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const { viewedVideoIds } = req.body;
        const objectIds = viewedVideoIds.map((id) => new mongodb_1.ObjectId(id));
        const video = await db.collection('videos').findOne({
            category: req.params.category,
            _id: { $nin: objectIds }
        });
        if (!video) {
            return res.status(404).json({ error: 'Nenhum vídeo disponível' });
        }
        res.json({
            ...video,
            id: video._id.toString()
        });
    }
    catch (error) {
        console.error('Erro ao buscar próximo vídeo:', error);
        res.status(500).json({ error: 'Erro ao buscar próximo vídeo' });
    }
});
// GET /api/videos/:id/stream - Obter URL assinada para streaming
router.get('/:id/stream', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const video = await db.collection('videos').findOne({
            _id: new mongodb_1.ObjectId(req.params.id)
        });
        if (!video) {
            return res.status(404).json({ error: 'Vídeo não encontrado' });
        }
        const url = await (0, cloudflareR2Service_1.generateSignedUrl)(video._id.toString());
        res.json({ url });
    }
    catch (error) {
        console.error('Erro ao gerar URL de streaming:', error);
        res.status(500).json({ error: 'Erro ao gerar URL de streaming' });
    }
});
// POST /api/videos/:id/upload - Obter URL assinada para upload
router.post('/:id/upload', async (req, res) => {
    try {
        const { contentType } = req.body;
        const url = await (0, cloudflareR2Service_1.generateUploadUrl)(req.params.id, contentType);
        res.json({ url });
    }
    catch (error) {
        console.error('Erro ao gerar URL de upload:', error);
        res.status(500).json({ error: 'Erro ao gerar URL de upload' });
    }
});
// POST /api/videos - Criar novo vídeo
router.post('/', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const video = req.body;
        const result = await db.collection('videos').insertOne({
            ...video,
            views: 0,
            createdAt: new Date(),
            lastViewed: null
        });
        res.status(201).json({
            ...video,
            id: result.insertedId.toString()
        });
    }
    catch (error) {
        console.error('Erro ao criar vídeo:', error);
        res.status(500).json({ error: 'Erro ao criar vídeo' });
    }
});
// PUT /api/videos/:id - Atualizar vídeo
router.put('/:id', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const video = req.body;
        const result = await db.collection('videos').updateOne({ _id: new mongodb_1.ObjectId(req.params.id) }, { $set: video });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Vídeo não encontrado' });
        }
        res.json({ message: 'Vídeo atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar vídeo:', error);
        res.status(500).json({ error: 'Erro ao atualizar vídeo' });
    }
});
// DELETE /api/videos/:id - Excluir vídeo
router.delete('/:id', async (req, res) => {
    try {
        const db = (0, mongoService_1.getDb)();
        const result = await db.collection('videos').deleteOne({
            _id: new mongodb_1.ObjectId(req.params.id)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Vídeo não encontrado' });
        }
        res.json({ message: 'Vídeo excluído com sucesso' });
    }
    catch (error) {
        console.error('Erro ao excluir vídeo:', error);
        res.status(500).json({ error: 'Erro ao excluir vídeo' });
    }
});
exports.videoRoutes = router;
