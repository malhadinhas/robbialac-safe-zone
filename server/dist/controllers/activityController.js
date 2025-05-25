"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivities = exports.registerActivity = void 0;
exports.registerActivityData = registerActivityData;
exports.getFeed = getFeed;
const UserActivity_1 = __importDefault(require("../models/UserActivity"));
const logger_1 = __importDefault(require("../utils/logger")); // Utilitário de logging
const mongodb_1 = require("mongodb"); // Tipo ObjectId do MongoDB
const medalController_1 = require("./medalController"); // Função para verificar conquistas de medalhas baseadas em ações
// Importa modelos Mongoose para buscar documentos no getFeed
const Accident_1 = __importDefault(require("../models/Accident"));
const Sensibilizacao_1 = __importDefault(require("../models/Sensibilizacao"));
// Importa modelos Like e Comment para usar na agregação do getFeed
const Like_1 = __importDefault(require("../models/Like"));
const Comment_1 = __importDefault(require("../models/Comment"));
const mongoose_1 = __importDefault(require("mongoose")); // Importa mongoose para usar ObjectId
const User_1 = __importDefault(require("../models/User")); // Importa o modelo User
/**
 * @function registerActivityData
 * @description Função utilitária para registar atividade a partir de dados (uso interno)
 * @param {Object} params - Objeto com os dados da atividade
 * @returns {Promise<void>} - Retorna uma Promise que resolve quando a atividade é registrada com sucesso
 */
async function registerActivityData({ userId, category, activityId, points, details }) {
    // Validação 1: Verifica se os campos obrigatórios foram fornecidos.
    if (!userId || !category || !activityId || points === undefined) {
        logger_1.default.warn('Tentativa de registrar atividade com dados incompletos', { userId, category, activityId, points });
        throw new Error('Dados incompletos para registro de atividade');
    }
    const validCategories = ['video', 'incident', 'training', 'medal'];
    if (!validCategories.includes(category)) {
        logger_1.default.warn(`Categoria inválida recebida: ${category}`, { userId, activityId });
        throw new Error('Categoria inválida');
    }
    const activity = {
        userId,
        category,
        activityId,
        points: Number(points),
        timestamp: new Date(),
        details
    };
    await UserActivity_1.default.create(activity);
    // Atualizar pontos do utilizador
    const userObjectId = mongoose_1.default.Types.ObjectId.isValid(userId) ? new mongoose_1.default.Types.ObjectId(userId) : null;
    const userQuery = userObjectId ? { _id: userObjectId } : { id: userId };
    await User_1.default.updateOne(userQuery, { $inc: { points: Number(points) } });
    // Verificar medalhas
    if (category === 'video' || category === 'incident' || category === 'training') {
        await (0, medalController_1.checkActionBasedMedals)(userId, category, details);
    }
}
/**
 * @function registerActivity
 * @description Controller de rota (mantém compatibilidade API REST)
 * @param {Request} req - Objeto da requisição Express (espera `req.body` com dados da atividade).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 201 e dados da atividade/medalhas ou um erro (400/500).
 */
const registerActivity = async (req, res) => {
    try {
        const { userId, category, activityId, points, details } = req.body;
        await registerActivityData({ userId, category, activityId, points, details });
        res.status(201).json({ message: 'Atividade registrada com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao registrar atividade:', {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            requestBody: req.body,
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            message: 'Erro ao registrar atividade',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};
exports.registerActivity = registerActivity;
/**
 * @function generateActivityDescription
 * @description Função auxiliar para criar uma descrição textual legível para uma atividade,
 * baseando-se na sua categoria e nos detalhes armazenados.
 * @param {UserActivity} activity - O objeto da atividade do usuário.
 * @returns {string} Uma string descritiva da atividade.
 */
function generateActivityDescription(activity) {
    // Usa um switch na categoria da atividade para gerar descrições diferentes.
    switch (activity.category) {
        case 'video':
            // Tenta usar o título do vídeo, se disponível nos detalhes.
            if (activity.details?.title) {
                return `Assistiu vídeo: '${activity.details.title}'`;
            }
            // Se não houver título, mas houver contagem > 1 (caso de agregação futura?)
            if (activity.details?.count && activity.details.count > 1) {
                return `Assistiu ${activity.details.count} vídeos de segurança`;
            }
            // Descrição genérica para vídeo.
            return 'Assistiu um vídeo de segurança';
        case 'incident':
            // Tenta usar o título do incidente.
            if (activity.details?.title) {
                return `Reportou quase acidente: '${activity.details.title}'`;
            }
            // Tenta usar o tipo do incidente.
            if (activity.details?.type) {
                return `Reportou quase acidente do tipo ${activity.details.type}`;
            }
            // Descrição genérica para incidente.
            return 'Reportou um quase acidente';
        case 'training':
            // Tenta usar o título da formação.
            if (activity.details?.title) {
                return `Completou formação: '${activity.details.title}'`;
            }
            // Verifica se é um curso completo.
            if (activity.details?.isFullCourse) {
                return 'Completou curso completo de segurança';
            }
            // Descrição genérica para formação.
            return 'Completou um módulo de formação';
        case 'medal':
            // Tenta usar o nome da medalha.
            if (activity.details?.name) {
                return `Medalha desbloqueada: '${activity.details.name}'`;
            }
            // Descrição genérica para medalha.
            return 'Conquistou uma nova medalha';
        default:
            // Descrição padrão para categorias não reconhecidas.
            return 'Realizou uma atividade na plataforma';
    }
}
/**
 * @function getUserActivities
 * @description Controladora para buscar o histórico de atividades recentes de um usuário específico.
 * Recebe o ID do usuário via `req.params`.
 * Busca as atividades na coleção 'user_activities', ordenadas por data descendente.
 * Formata as atividades (gera descrição, converte ID e data) antes de enviá-las.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.userId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de atividades formatadas ou um erro (400/500).
 */
const getUserActivities = async (req, res) => {
    try {
        const { userId } = req.params; // ID do usuário da URL.
        // Limite de atividades a serem retornadas (padrão 10), obtido da query string.
        const limit = parseInt(req.query.limit) || 10;
        // Validação: Verifica se o ID do usuário foi fornecido.
        if (!userId) {
            logger_1.default.warn('Requisição para buscar atividades sem userId.');
            res.status(400).json({ message: 'ID de usuário é obrigatório' });
            return;
        }
        logger_1.default.info(`Buscando ${limit} atividades mais recentes do usuário ${userId}`);
        // Obtém a coleção 'user_activities'.
        const activities = await UserActivity_1.default.find({ userId })
            .sort({ timestamp: -1 }) // Ordena pela data/hora mais recente primeiro.
            .limit(limit) // Limita o número de resultados.
            .lean();
        // Formata as atividades antes de enviar para o frontend.
        const formattedActivities = activities.map(activity => {
            // Desestrutura o objeto da atividade, separando _id e timestamp.
            const { _id, timestamp, userId: activityUserId, ...rest } = activity;
            // Retorna um novo objeto formatado.
            return {
                id: _id instanceof mongodb_1.ObjectId ? _id.toString() : String(_id), // Converte _id (ObjectId ou outro) para string.
                userId: activityUserId, // Mantém userId.
                ...rest, // Inclui os campos restantes (category, activityId, points, details).
                description: generateActivityDescription(activity), // Gera a descrição.
                // Converte o timestamp (Date ou string) para string ISO 8601.
                date: timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString()
            };
        });
        logger_1.default.info(`${formattedActivities.length} atividades formatadas encontradas para o usuário ${userId}`);
        // Responde com o array de atividades formatadas.
        res.json(formattedActivities);
    }
    catch (error) {
        // Captura erros gerais.
        logger_1.default.error('Erro ao buscar atividades do usuário:', {
            userId: req.params.userId,
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            stack: error instanceof Error ? error.stack : undefined
        });
        // Responde com erro 500 Internal Server Error.
        res.status(500).json({
            message: 'Erro ao buscar atividades',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
};
exports.getUserActivities = getUserActivities;
/**
 * @function getFeed
 * @description Controladora para gerar um feed de atividades/novidades unificado.
 * Combina os Quase Acidentes (da coleção 'incidents'), Acidentes e Sensibilizações
 * mais recentes, ordenados por data.
 * Utiliza agregação para buscar as contagens de likes e comentários para cada item do feed.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de itens do feed formatados ou um erro (400/500).
 */
async function getFeed(req, res) {
    logger_1.default.info('Requisição recebida para buscar feed unificado...');
    try {
        const limit = parseInt(req.query.limit) || 10;
        logger_1.default.info(`Limite definido para o feed: ${limit}`);
        if (limit <= 0) {
            logger_1.default.warn('Limite inválido solicitado para o feed', { limit });
            res.status(400).json({ error: 'O limite deve ser um número positivo.' });
            return;
        }
        // --- PASSO 1: Buscar os documentos base de cada tipo ---
        const recentQAs = await UserActivity_1.default.find({})
            .sort({ date: -1 })
            .limit(limit)
            .select('_id title date')
            .lean();
        logger_1.default.info(`Encontrados ${recentQAs.length} Quase Acidentes recentes.`);
        const recentAccidents = await Accident_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id name createdAt')
            .lean()
            .exec();
        logger_1.default.info(`Encontrados ${recentAccidents.length} Acidentes recentes.`);
        const recentSensibilizacoes = await Sensibilizacao_1.default.find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('_id name createdAt')
            .lean()
            .exec();
        logger_1.default.info(`Encontradas ${recentSensibilizacoes.length} Sensibilizações recentes.`);
        // --- PASSO 2: Formatar e Combinar os Itens Base ---
        let combinedBaseItems = [
            ...recentQAs.map(qa => ({
                _id: qa._id,
                type: 'qa',
                title: qa.title,
                date: qa.date,
            })),
            ...recentAccidents.map(doc => ({
                _id: doc._id,
                type: 'document',
                title: doc.name,
                date: doc.createdAt,
                documentType: 'Acidente'
            })),
            ...recentSensibilizacoes.map(doc => ({
                _id: doc._id,
                type: 'document',
                title: doc.name,
                date: doc.createdAt,
                documentType: 'Sensibilizacao'
            }))
        ];
        logger_1.default.info(`Total de ${combinedBaseItems.length} itens base combinados antes da ordenação final.`);
        // --- PASSO 3: Ordenar e Limitar Itens Base Combinados ---
        combinedBaseItems.sort((a, b) => b.date.getTime() - a.date.getTime());
        const topItems = combinedBaseItems.slice(0, limit);
        const itemIds = topItems.map(item => item._id);
        logger_1.default.info(`Selecionados os ${topItems.length} itens mais recentes para o feed.`);
        // --- PASSO 4: Buscar Contagens de Likes e Comments para os Itens Selecionados ---
        const likeCounts = await Like_1.default.aggregate([
            { $match: { itemId: { $in: itemIds } } },
            { $group: { _id: '$itemId', count: { $sum: 1 } } }
        ]);
        logger_1.default.info(`Contagem de likes obtida para ${likeCounts.length} itens.`);
        const commentCounts = await Comment_1.default.aggregate([
            { $match: { itemId: { $in: itemIds } } },
            { $group: { _id: '$itemId', count: { $sum: 1 } } }
        ]);
        logger_1.default.info(`Contagem de comentários obtida para ${commentCounts.length} itens.`);
        const likesMap = new Map(likeCounts.map(item => [item._id.toString(), item.count]));
        const commentsMap = new Map(commentCounts.map(item => [item._id.toString(), item.count]));
        // --- PASSO 5: Formatar a Resposta Final ---
        const finalFeed = topItems.map(item => ({
            _id: item._id.toString(),
            type: item.type,
            title: item.title,
            date: item.date.toISOString(),
            documentType: item.documentType,
            likeCount: likesMap.get(item._id.toString()) || 0,
            commentCount: commentsMap.get(item._id.toString()) || 0
        }));
        // --- PASSO 6: Buscar e Incluir Atividades de Like e Comentário ---
        const recentActivities = await UserActivity_1.default.find({
            category: { $in: ['incident', 'training'] },
            'details.action': { $in: ['like', 'comment'] }
        })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
        logger_1.default.info(`Encontradas ${recentActivities.length} atividades de like/comentário recentes.`);
        // Formatar atividades de like e comentário como FeedItem
        const activityFeedItems = recentActivities.map(activity => {
            const { _id, userId, category, activityId, timestamp, details } = activity;
            return {
                _id: _id.toString(),
                type: 'activity', // Novo tipo para diferenciar
                title: details.itemTitle || 'Item sem título',
                date: timestamp.toISOString(),
                documentType: details.itemType === 'qa' ? 'Quase Acidente' : details.itemType === 'accident' ? 'Acidente' : 'Sensibilizacao',
                action: details.action, // 'like' ou 'comment'
                userName: details.userName || 'Utilizador Desconhecido',
                commentText: details.commentText // Texto do comentário, se for uma atividade de comentário
            };
        });
        // Combinar e ordenar todos os itens do feed
        const allFeedItems = [...finalFeed, ...activityFeedItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
        logger_1.default.info(`Retornando ${allFeedItems.length} itens formatados para o feed com contagens de interações e atividades.`);
        res.json(allFeedItems);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar feed unificado:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            query: req.query
        });
        res.status(500).json({
            error: 'Erro ao buscar feed de novidades',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
// --- Fim da Função getFeed --- 
