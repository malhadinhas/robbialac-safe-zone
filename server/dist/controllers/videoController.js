"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentVideos = exports.getLastViewedVideosByCategory = exports.incrementVideoViews = exports.deleteVideo = exports.updateVideo = exports.createVideo = exports.getVideoById = exports.getVideos = void 0;
const Video_1 = __importDefault(require("../models/Video"));
const logger_1 = __importDefault(require("../utils/logger"));
const videoProcessingService_1 = require("../services/videoProcessingService");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const uuid_1 = require("uuid");
const mongoose_1 = require("mongoose");
const UploadLog_1 = __importDefault(require("../models/UploadLog"));
const videoProcessor = new videoProcessingService_1.VideoProcessor();
const TEMP_DIR = path_1.default.join(process.cwd(), 'temp');
// Buscar todos os vídeos
const getVideos = async (req, res) => {
    try {
        const videosFromDb = await Video_1.default.find().lean();
        logger_1.default.info(`Vídeos recuperados do DB para GET /api/videos: ${videosFromDb.length}`);
        res.json(videosFromDb);
        logger_1.default.info('Dados dos vídeos a serem enviados na resposta GET /api/videos:', videosFromDb);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar vídeos em GET /api/videos', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ message: 'Erro ao recuperar vídeos' });
    }
};
exports.getVideos = getVideos;
// Buscar um vídeo específico
const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de acesso GET /api/videos/:id com ID inválido', { id });
            res.status(400).json({ message: 'ID de vídeo inválido' });
            return;
        }
        const video = await Video_1.default.findById(id).lean();
        if (!video) {
            logger_1.default.warn('Vídeo não encontrado em GET /api/videos/:id', { id });
            res.status(404).json({ message: 'Vídeo não encontrado' });
            return;
        }
        logger_1.default.info(`Vídeo encontrado em GET /api/videos/:id : ${id}`, { videoStatus: video.status });
        logger_1.default.info(`Dados do vídeo a serem enviados na resposta GET /api/videos/${id}:`, video);
        res.json(video);
        return;
    }
    catch (error) {
        logger_1.default.error('Erro ao obter vídeo por ID em GET /api/videos/:id', {
            error: error instanceof Error ? error.message : String(error),
            id: req.params.id,
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({ message: 'Erro ao obter vídeo por ID' });
        return;
    }
};
exports.getVideoById = getVideoById;
// Função auxiliar para obter mensagem de erro
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
// Criar um novo vídeo
const createVideo = async (req, res) => {
    let videoId = null;
    let originalFilePath = null;
    let uploadedFileSize = null;
    let uploadedMimeType = null;
    try {
        logger_1.default.info('Iniciando criação de vídeo', {
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                size: req.file.size,
                mimetype: req.file.mimetype
            } : null
        });
        if (!req.file) {
            logger_1.default.error('Nenhum arquivo enviado');
            return;
        }
        originalFilePath = req.file.path;
        uploadedFileSize = req.file.size;
        uploadedMimeType = req.file.mimetype;
        // Validar campos obrigatórios
        const requiredFields = ['title', 'description', 'category', 'zone'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            logger_1.default.warn('Campos obrigatórios ausentes', { missingFields });
            return;
        }
        try {
            // Validar o vídeo
            const videoProcessor = new videoProcessingService_1.VideoProcessor();
            const videoInfo = await videoProcessor.validateVideo(req.file.path);
            if (!videoInfo) {
                logger_1.default.error('Erro na validação do vídeo');
                return;
            }
            // Gerar um videoId único usando UUID
            const uniqueVideoId = (0, uuid_1.v4)();
            // Validar categoria
            const validCategories = ['Segurança', 'Qualidade', 'Procedimentos e Regras', 'Treinamento', 'Equipamentos', 'Outros', 'Procedimentos'];
            let category = req.body.category;
            if (!validCategories.includes(category)) {
                // Normalizar a categoria
                if (category.toLowerCase().includes('seguranca') || category.toLowerCase().includes('segurança')) {
                    category = 'Segurança';
                }
                else if (category.toLowerCase().includes('treinamento')) {
                    category = 'Treinamento';
                }
                else if (category.toLowerCase().includes('procedimento')) {
                    category = 'Procedimentos';
                }
                else {
                    category = 'Outros';
                }
            }
            // Definir chaves R2 temporárias/placeholders
            const temporaryR2VideoKey = `temp/${req.file.filename}`; // Chave temporária para o vídeo original
            const temporaryR2ThumbnailKey = 'placeholders/thumbnail.jpg'; // Chave placeholder para thumbnail
            // Criar objeto do vídeo inicial com valores temporários para os campos obrigatórios
            const video = new Video_1.default({
                videoId: uniqueVideoId,
                title: req.body.title.trim(),
                description: req.body.description.trim(),
                category: category,
                zone: req.body.zone,
                duration: videoInfo.duration || 0,
                r2VideoKey: temporaryR2VideoKey, // Usar chave temporária
                r2ThumbnailKey: temporaryR2ThumbnailKey, // Usar chave placeholder
                views: 0,
                uploadDate: new Date(),
                r2Qualities: {
                    high: temporaryR2VideoKey,
                    medium: temporaryR2VideoKey,
                    low: temporaryR2VideoKey
                },
                status: 'processing'
            });
            // Salvar para obter o ID
            await video.save();
            videoId = video._id?.toString() ?? null;
            logger_1.default.info('Vídeo criado com sucesso, iniciando processamento', {
                id: videoId,
                videoId: uniqueVideoId,
                title: video.title
            });
            // Retornar resposta imediata ANTES do processamento
            res.status(202).json({
                message: 'Vídeo recebido e em processamento',
                videoId: video._id,
                uniqueId: video.videoId,
                status: 'processing'
            });
            // Iniciar processamento em background
            process.nextTick(async () => {
                try {
                    // Gerar thumbnail e obter a chave R2
                    const thumbnailR2Key = await videoProcessor.generateThumbnail(originalFilePath, videoId.toString());
                    // Processar vídeo em diferentes qualidades e obter as chaves R2
                    const processedR2Keys = await videoProcessor.processVideo(originalFilePath, videoId.toString());
                    // ** LOG DETALHADO ANTES DO UPDATE **
                    logger_1.default.info('Valores para atualizar no MongoDB', {
                        videoIdToUpdate: videoId?.toString(),
                        updateData: {
                            r2VideoKey: processedR2Keys?.high,
                            r2ThumbnailKey: thumbnailR2Key,
                            r2Qualities: processedR2Keys,
                            status: 'ready'
                        }
                    });
                    // Verificar se as chaves são válidas
                    if (!videoId || !thumbnailR2Key || !processedR2Keys?.high) {
                        logger_1.default.error('ERRO CRÍTICO: ID do vídeo ou chaves R2 em falta antes de atualizar o MongoDB!', {
                            videoIdExists: !!videoId,
                            thumbnailKeyExists: !!thumbnailR2Key,
                            highQualityKeyExists: !!processedR2Keys?.high
                        });
                        // Atualizar status para erro se chaves críticas faltarem
                        await Video_1.default.findByIdAndUpdate(videoId, {
                            status: 'error',
                            processingError: 'Falha ao obter chaves R2 necessárias após processamento.'
                        });
                        return; // Não continuar com a atualização normal
                    }
                    // Atualizar vídeo com as chaves R2 e status
                    const updateResult = await Video_1.default.findByIdAndUpdate(videoId, {
                        r2VideoKey: processedR2Keys.high,
                        r2ThumbnailKey: thumbnailR2Key,
                        r2Qualities: {
                            high: processedR2Keys.high,
                            medium: processedR2Keys.medium,
                            low: processedR2Keys.low
                        },
                        status: 'ready'
                    }, { new: true });
                    // ** LOG DO RESULTADO DO UPDATE **
                    logger_1.default.info('Resultado da operação findByIdAndUpdate', {
                        videoIdUpdated: videoId?.toString(),
                        updateResult // Logar o documento retornado (ou null se não encontrado/falhou)
                    });
                    // Verificar se o resultado contém as chaves (redundante se {new: true} funcionar)
                    if (!updateResult || !updateResult.r2ThumbnailKey || !updateResult.r2VideoKey) {
                        logger_1.default.error('ERRO PÓS-UPDATE: Documento atualizado não contém as chaves R2 esperadas!', {
                            updateResult // Logar o que foi retornado
                        });
                    }
                    // <<< INÍCIO: Registar Upload Log >>>
                    if (updateResult && updateResult.status === 'ready' && uploadedFileSize) {
                        try {
                            const newUploadLog = await UploadLog_1.default.create({
                                userId: req.user?.id,
                                fileName: req.file?.originalname || 'desconhecido',
                                fileSize: uploadedFileSize,
                                mimeType: uploadedMimeType || 'desconhecido',
                                storageType: 'r2',
                                fileKey: updateResult.r2VideoKey,
                                timestamp: new Date()
                            });
                            logger_1.default.info('Evento de upload registado com sucesso', { videoId: videoId.toString(), fileKey: newUploadLog.fileKey });
                        }
                        catch (logError) {
                            logger_1.default.error('Falha ao registar evento de upload', { videoId: videoId.toString(), error: logError instanceof Error ? logError.message : String(logError) });
                        }
                    }
                    // <<< FIM: Registar Upload Log >>>
                    logger_1.default.info('Processamento do vídeo concluído e chaves R2 atualizadas', {
                        id: videoId,
                        title: video.title,
                        keys: {
                            thumbnail: thumbnailR2Key,
                            high: processedR2Keys.high,
                            medium: processedR2Keys.medium,
                            low: processedR2Keys.low
                        }
                    });
                    // Limpar arquivo temporário original APÓS sucesso
                    if (originalFilePath) {
                        try {
                            await fs_1.promises.unlink(originalFilePath);
                            logger_1.default.info('Arquivo temporário original removido após sucesso', { path: originalFilePath });
                        }
                        catch (cleanupError) {
                            logger_1.default.error('Erro ao remover arquivo temporário original após sucesso', { error: cleanupError });
                        }
                    }
                }
                catch (error) {
                    logger_1.default.error('Erro no processamento do vídeo', {
                        error,
                        videoId
                    });
                    // Atualizar status para erro
                    if (videoId) {
                        await Video_1.default.findByIdAndUpdate(videoId, {
                            status: 'error',
                            processingError: error instanceof Error ? error.message : 'Erro desconhecido'
                        });
                    }
                    // Limpar arquivo temporário original em caso de erro no processamento
                    if (originalFilePath) {
                        try {
                            await fs_1.promises.unlink(originalFilePath);
                            logger_1.default.info('Arquivo temporário original removido após erro no processamento', { path: originalFilePath });
                        }
                        catch (cleanupError) {
                            logger_1.default.error('Erro ao remover arquivo temporário original após erro no processamento', { error: cleanupError });
                        }
                    }
                }
            });
        }
        catch (validationError) {
            logger_1.default.error('Erro na validação ou criação do vídeo', { validationError: validationError instanceof Error ? validationError.message : String(validationError) });
            if (req.file) {
                try {
                    await fs_1.promises.unlink(req.file.path);
                    logger_1.default.info('Arquivo temporário removido após erro de validação', { path: req.file.path });
                }
                catch (cleanupError) {
                    logger_1.default.error('Erro ao remover arquivo temporário', { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError), path: req.file.path });
                }
            }
            return;
        }
    }
    catch (error) {
        logger_1.default.error('Erro GERAL ao criar vídeo', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        if (originalFilePath) {
            try {
                await fs_1.promises.unlink(originalFilePath);
                logger_1.default.info('Arquivo temporário original removido após erro inicial', { path: originalFilePath });
            }
            catch (cleanupError) {
                logger_1.default.error('Erro ao remover arquivo temporário original após erro inicial', { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
            }
        }
        if (error instanceof Error && error.name === 'ValidationError') {
            res.status(400).json({ message: 'Erro de validação ao criar vídeo' });
            return;
        }
        res.status(500).json({ message: 'Erro ao criar vídeo' });
    }
};
exports.createVideo = createVideo;
// Atualizar um vídeo
const updateVideo = async (req, res) => {
    try {
        const video = await Video_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!video) {
            logger_1.default.warn('Vídeo não encontrado para atualização', { id: req.params.id });
            res.status(404).json({ message: 'Vídeo não encontrado para atualização' });
            return;
        }
        logger_1.default.info('Vídeo atualizado com sucesso', { id: video._id });
        res.json(video);
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar vídeo', { id: req.params.id, error });
        res.status(500).json({ message: 'Erro ao atualizar vídeo' });
    }
};
exports.updateVideo = updateVideo;
// Excluir um vídeo
const deleteVideo = async (req, res) => {
    try {
        const video = await Video_1.default.findByIdAndDelete(req.params.id);
        if (!video) {
            logger_1.default.warn('Vídeo não encontrado para exclusão', { id: req.params.id });
            res.status(404).json({ message: 'Vídeo não encontrado para exclusão' });
            return;
        }
        logger_1.default.info('Vídeo excluído com sucesso', { id: req.params.id });
        res.json({ message: 'Vídeo excluído com sucesso' });
        return;
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir vídeo', { id: req.params.id, error });
        res.status(500).json({ message: 'Erro ao excluir vídeo' });
        return;
    }
};
exports.deleteVideo = deleteVideo;
// Incrementar visualizações
const incrementVideoViews = async (req, res) => {
    try {
        if (!req.params.id) {
            logger_1.default.warn('Tentativa de incrementar visualizações sem ID do vídeo');
            res.status(400).json({ message: 'ID do vídeo é obrigatório' });
            return;
        }
        const video = await Video_1.default.findOneAndUpdate({ id: req.params.id }, { $inc: { views: 1 } }, { new: true });
        if (!video) {
            logger_1.default.warn(`Vídeo não encontrado para incremento de views: ${req.params.id}`);
            res.status(404).json({ message: 'Vídeo não encontrado para incremento de views' });
            return;
        }
        logger_1.default.info(`Visualizações incrementadas com sucesso para o vídeo: ${video.id}`);
        res.json(video);
    }
    catch (error) {
        logger_1.default.error('Erro ao incrementar visualizações:', {
            error,
            videoId: req.params.id
        });
        res.status(500).json({ message: 'Erro ao incrementar visualizações' });
    }
};
exports.incrementVideoViews = incrementVideoViews;
// Buscar vídeos mais visualizados por categoria
const getLastViewedVideosByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        logger_1.default.info('Buscando vídeos por categoria', { category, limit });
        const videos = await Video_1.default.find({ category })
            .sort({ views: -1 })
            .limit(limit)
            .lean();
        logger_1.default.info('Vídeos recuperados com sucesso', {
            category,
            count: videos.length
        });
        res.json(videos);
        return;
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar vídeos por categoria', {
            error: error instanceof Error ? error.message : String(error),
            category: req.params.category,
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        res.status(500).json({ message: 'Erro ao buscar vídeos por categoria' });
        return;
    }
};
exports.getLastViewedVideosByCategory = getLastViewedVideosByCategory;
// Função para buscar vídeos recentes
const getRecentVideos = async (req, res) => {
    logger_1.default.info('Attempting to fetch recent videos...'); // Log inicial
    try {
        const limit = parseInt(req.query.limit) || 5;
        logger_1.default.info(`Parsed limit: ${limit}`); // Log do limite
        if (limit <= 0) {
            logger_1.default.warn('Invalid limit requested for recent videos', { limit });
            res.status(400).json({ message: 'O limite deve ser um número positivo.' });
            return;
        }
        logger_1.default.info(`Querying database for ${limit} recent videos...`);
        const recentVideos = await Video_1.default.find({ status: 'ready' }) // Buscar apenas vídeos prontos?
            .sort({ createdAt: -1 }) // Ordena por data de criação, mais recente primeiro
            .limit(limit)
            .select('_id title createdAt') // Selecionar apenas campos necessários
            .lean();
        logger_1.default.info(`Found ${recentVideos.length} recent videos.`);
        // Não precisamos mapear aqui se select já fez o trabalho
        // const formattedVideos = recentVideos.map(vid => ({
        //   _id: vid._id,
        //   title: vid.title,
        //   createdAt: vid.createdAt.toISOString(),
        // }));
        res.json(recentVideos); // Retorna os vídeos diretamente
    }
    catch (error) {
        logger_1.default.error('Error fetching recent videos:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            query: req.query
        });
        res.status(500).json({ message: 'Erro ao buscar vídeos recentes' });
    }
};
exports.getRecentVideos = getRecentVideos;
