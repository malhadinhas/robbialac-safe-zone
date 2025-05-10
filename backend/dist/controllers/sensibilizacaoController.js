"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSensibilizacao = exports.updateSensibilizacao = exports.getSensibilizacaoById = exports.getSensibilizacoes = exports.createSensibilizacao = void 0;
const Sensibilizacao_1 = __importDefault(require("../models/Sensibilizacao"));
const logger_1 = __importDefault(require("../utils/logger"));
const storage_1 = require("../services/storage");
const storage_2 = require("../services/storage");
const storage_3 = require("../services/storage");
const mongoose_1 = __importDefault(require("mongoose"));
const createSensibilizacao = async (req, res) => {
    try {
        logger_1.default.info('Criando novo documento de sensibilização:', req.body);
        if (!req.file) {
            return res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
        }
        // Gerar chave única para o arquivo
        const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;
        // Sempre fazer upload do arquivo para o R2
        await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
        const sensibilizacaoData = {
            name: req.body.name,
            country: req.body.country,
            date: new Date(req.body.date),
            pdfFile: {
                key,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype
            }
        };
        logger_1.default.info('Dados da sensibilização:', sensibilizacaoData);
        const sensibilizacao = new Sensibilizacao_1.default(sensibilizacaoData);
        const savedSensibilizacao = await sensibilizacao.save();
        logger_1.default.info('Documento de sensibilização salvo com sucesso:', {
            id: savedSensibilizacao._id
        });
        res.status(201).json(savedSensibilizacao);
    }
    catch (error) {
        logger_1.default.error('Erro no createSensibilizacao:', {
            error: error.message,
            stack: error.stack,
            body: req.body
        });
        res.status(400).json({
            error: 'Erro ao criar documento de sensibilização',
            details: error.message
        });
    }
};
exports.createSensibilizacao = createSensibilizacao;
const getSensibilizacoes = async (req, res) => {
    try {
        const userId = (req.user?.id && mongoose_1.default.Types.ObjectId.isValid(req.user.id))
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        logger_1.default.info('Iniciando busca de documentos de sensibilização com agregação');
        const { country, startDate, endDate } = req.query;
        const matchQuery = {};
        logger_1.default.info(`Filtros: country=${country}, startDate=${startDate}, endDate=${endDate}`);
        if (country)
            matchQuery.country = country;
        if (startDate && endDate) {
            matchQuery.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        const aggregationPipeline = [
            { $match: matchQuery },
            { $sort: { date: -1 } },
            {
                $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'itemId',
                    as: 'likesData'
                }
            },
            {
                $lookup: {
                    from: 'comments',
                    localField: '_id',
                    foreignField: 'itemId',
                    as: 'commentsData'
                }
            },
            {
                $addFields: {
                    likeCount: { $size: '$likesData' },
                    commentCount: { $size: '$commentsData' },
                    userHasLiked: userId ? { $in: [userId, '$likesData.userId'] } : false
                }
            },
            {
                $project: {
                    likesData: 0,
                    commentsData: 0
                }
            }
        ];
        logger_1.default.info('Executando agregação para Sensibilizacao...');
        const sensibilizacoes = await Sensibilizacao_1.default.aggregate(aggregationPipeline);
        logger_1.default.info(`Agregação concluída, ${sensibilizacoes.length} documentos processados`);
        if (sensibilizacoes.length === 0) {
            return res.json([]);
        }
        const sensibilizacoesWithUrls = await Promise.all(sensibilizacoes.map(async (sensibilizacao) => {
            try {
                logger_1.default.info('Gerando URL assinada para documento', {
                    sensibilizacaoId: sensibilizacao._id,
                    pdfKey: sensibilizacao.pdfFile?.key
                });
                if (!sensibilizacao.pdfFile || !sensibilizacao.pdfFile.key) {
                    logger_1.default.warn('Documento sem chave PDF', { sensibilizacaoId: sensibilizacao._id });
                    return { ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: null };
                }
                const signedUrl = await (0, storage_2.getSignedUrl)(sensibilizacao.pdfFile.key);
                logger_1.default.info('URL assinada gerada com sucesso', {
                    sensibilizacaoId: sensibilizacao._id,
                    hasUrl: !!signedUrl
                });
                return { ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: signedUrl };
            }
            catch (urlError) {
                logger_1.default.error('Erro ao gerar URL para documento específico', {
                    sensibilizacaoId: sensibilizacao._id,
                    error: urlError
                });
                return { ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: null };
            }
        }));
        logger_1.default.info(`URLs geradas para ${sensibilizacoesWithUrls.length} documentos`);
        res.json(sensibilizacoesWithUrls);
    }
    catch (error) {
        logger_1.default.error('Erro no getSensibilizacoes:', {
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({
            error: 'Erro ao buscar documentos de sensibilização',
            details: error.message
        });
    }
};
exports.getSensibilizacoes = getSensibilizacoes;
const getSensibilizacaoById = async (req, res) => {
    try {
        if (!mongoose_1.default.Types.ObjectId.isValid(req.params.id)) {
            logger_1.default.warn('ID inválido fornecido para getSensibilizacaoById', { id: req.params.id });
            return res.status(400).json({ error: 'ID do documento inválido' });
        }
        const docId = new mongoose_1.default.Types.ObjectId(req.params.id);
        const userId = (req.user?.id && mongoose_1.default.Types.ObjectId.isValid(req.user.id))
            ? new mongoose_1.default.Types.ObjectId(req.user.id)
            : null;
        logger_1.default.info('Buscando documento por ID com agregação', { docId, userId });
        const aggregationPipeline = [
            { $match: { _id: docId } },
            {
                $lookup: { from: 'likes', localField: '_id', foreignField: 'itemId', as: 'likesData' }
            },
            {
                $lookup: { from: 'comments', localField: '_id', foreignField: 'itemId', as: 'commentsData' }
            },
            {
                $addFields: {
                    likeCount: { $size: '$likesData' },
                    commentCount: { $size: '$commentsData' },
                    userHasLiked: userId ? { $in: [userId, '$likesData.userId'] } : false
                }
            },
            {
                $project: { likesData: 0, commentsData: 0 }
            }
        ];
        const results = await Sensibilizacao_1.default.aggregate(aggregationPipeline);
        if (!results || results.length === 0) {
            logger_1.default.warn('Documento não encontrado após agregação', { docId });
            return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
        }
        const sensibilizacao = results[0];
        logger_1.default.info('Documento encontrado com agregação', { docId, likeCount: sensibilizacao.likeCount, commentCount: sensibilizacao.commentCount });
        if (!sensibilizacao.pdfFile || !sensibilizacao.pdfFile.key) {
            logger_1.default.warn('Documento sem chave PDF', { sensibilizacaoId: sensibilizacao._id });
            res.json({ ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: null });
        }
        else {
            try {
                const signedUrl = await (0, storage_2.getSignedUrl)(sensibilizacao.pdfFile.key);
                logger_1.default.info('URL assinada gerada com sucesso para ID específico', { sensibilizacaoId: sensibilizacao._id });
                res.json({ ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: signedUrl });
            }
            catch (urlError) {
                logger_1.default.error('Erro ao gerar URL para documento específico (by ID)', { sensibilizacaoId: sensibilizacao._id, error: urlError.message });
                res.json({ ...sensibilizacao.toObject?.() ?? sensibilizacao, pdfUrl: null });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Erro no getSensibilizacaoById com agregação:', {
            error: error.message,
            id: req.params.id,
            stack: error.stack
        });
        res.status(500).json({
            error: 'Erro ao buscar documento de sensibilização',
            details: error.message
        });
    }
};
exports.getSensibilizacaoById = getSensibilizacaoById;
const updateSensibilizacao = async (req, res) => {
    try {
        const { name, country, date } = req.body;
        let updateData = { name, country, date };
        // Se um novo arquivo foi enviado
        if (req.file) {
            const sensibilizacao = await Sensibilizacao_1.default.findById(req.params.id);
            if (!sensibilizacao) {
                return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
            }
            // Deletar arquivo antigo do R2
            await (0, storage_3.deleteFromR2)(sensibilizacao.pdfFile.key);
            // Upload do novo arquivo
            const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;
            await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
            updateData.pdfFile = {
                key,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype
            };
        }
        const sensibilizacao = await Sensibilizacao_1.default.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
        if (!sensibilizacao) {
            return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
        }
        if (sensibilizacao && sensibilizacao.pdfFile && sensibilizacao.pdfFile.key) {
            try {
                const signedUrl = await (0, storage_2.getSignedUrl)(sensibilizacao.pdfFile.key);
                const sensibilizacaoWithUrl = {
                    ...sensibilizacao.toObject(),
                    pdfUrl: signedUrl
                };
                res.json(sensibilizacaoWithUrl);
            }
            catch (urlError) {
                logger_1.default.error('Erro ao gerar URL assinada para PDF após atualização.', { id: sensibilizacao._id, key: sensibilizacao.pdfFile.key, error: urlError.message });
                res.json({ ...sensibilizacao.toObject(), pdfUrl: null });
            }
        }
        else if (sensibilizacao) {
            logger_1.default.warn('Documento atualizado não possui chave PDF para gerar URL.', { id: sensibilizacao._id });
            res.json({ ...sensibilizacao.toObject(), pdfUrl: null });
        }
        else {
            res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
        }
    }
    catch (error) {
        logger_1.default.error('Erro no updateSensibilizacao:', {
            error: error.message,
            id: req.params.id,
            body: req.body
        });
        res.status(400).json({
            error: 'Erro ao atualizar documento de sensibilização',
            details: error.message
        });
    }
};
exports.updateSensibilizacao = updateSensibilizacao;
const deleteSensibilizacao = async (req, res) => {
    try {
        const sensibilizacao = await Sensibilizacao_1.default.findById(req.params.id);
        if (!sensibilizacao) {
            return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
        }
        // Deletar arquivo do R2
        await (0, storage_3.deleteFromR2)(sensibilizacao.pdfFile.key);
        await sensibilizacao.deleteOne();
        res.status(204).send();
    }
    catch (error) {
        logger_1.default.error('Erro no deleteSensibilizacao:', {
            error: error.message,
            id: req.params.id
        });
        res.status(500).json({
            error: 'Erro ao deletar documento de sensibilização',
            details: error.message
        });
    }
};
exports.deleteSensibilizacao = deleteSensibilizacao;
