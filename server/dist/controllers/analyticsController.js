"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorLogs = exports.getUploadStats = exports.getLoginStats = exports.getBasicAnalytics = void 0;
const logger_1 = __importDefault(require("../utils/logger")); // Utilitário de logging
const Video_1 = __importDefault(require("../models/Video")); // Modelo Mongoose para Vídeos
const User_1 = __importDefault(require("../models/User"));
const Incident_1 = __importDefault(require("../models/Incident"));
const LoginEvent_1 = __importDefault(require("../models/LoginEvent"));
const UploadLog_1 = __importDefault(require("../models/UploadLog"));
const UserActivity_1 = require("../models/UserActivity");
/**
 * @function getBasicAnalytics
 * @description Controladora para buscar dados analíticos básicos da aplicação.
 * Calcula contagens totais de usuários, incidentes e vídeos.
 * Inclui um exemplo de contagem de incidentes recentes.
 * @param {Request} req - Objeto da requisição Express.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um objeto JSON contendo as métricas básicas ou um erro (500).
 */
const getBasicAnalytics = async (req, res) => {
    logger_1.default.info('Requisição recebida para obter dados analíticos básicos');
    try {
        const totalUsers = await User_1.default.countDocuments();
        const totalIncidents = await Incident_1.default.countDocuments();
        const totalVideos = await Video_1.default.countDocuments();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentIncidentsCount = await Incident_1.default.countDocuments({ date: { $gte: thirtyDaysAgo } });
        const analyticsData = {
            totalUsers,
            totalIncidents,
            totalVideos,
            recentIncidentsCount,
        };
        logger_1.default.info('Dados analíticos básicos coletados com sucesso.', analyticsData);
        res.status(200).json(analyticsData);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter dados analíticos básicos:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        res.status(500).json({ message: 'Erro ao buscar dados analíticos' });
    }
};
exports.getBasicAnalytics = getBasicAnalytics;
/**
 * @function getGroupStage
 * @description Função auxiliar para criar o objeto de ID do estágio `$group`
 * da agregação do MongoDB, baseado no período de agrupamento desejado (dia, semana, mês, ano).
 * Isso permite reutilizar a lógica de agrupamento temporal em diferentes funções de estatísticas.
 * @param {string} groupBy - O período de agrupamento ('day', 'week', 'month', 'year').
 * @returns {object} Um objeto contendo a estrutura do campo `_id` para o estágio `$group`.
 */
const getGroupStage = (groupBy) => {
    // Variável para armazenar a estrutura do _id do grupo.
    let idField;
    // Define a estrutura do _id com base no parâmetro groupBy.
    // Utiliza operadores de data do MongoDB ($year, $month, $week, $dayOfMonth)
    // para extrair as partes relevantes do campo 'timestamp'.
    switch (groupBy) {
        case 'year':
            // Agrupa apenas por ano.
            idField = { year: { $year: "$timestamp" } };
            break;
        case 'month':
            // Agrupa por ano e mês.
            idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } };
            break;
        case 'week':
            // Agrupa por ano e número da semana (iniciando no domingo - %U).
            idField = { year: { $year: "$timestamp" }, week: { $week: "$timestamp" } };
            break;
        case 'day': // Caso padrão é agrupar por dia.
        default:
            // Agrupa por ano, mês e dia.
            idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" } };
            break;
    }
    // Retorna o objeto formatado para ser usado no $group.
    // Ex: { _id: { year: 2023, month: 10, day: 26 } }
    return { _id: idField };
};
/**
 * @function getLoginStats
 * @description Controladora para obter estatísticas de eventos de login,
 * agrupadas por um período de tempo (dia, semana, mês, ano).
 * Utiliza agregação para contar o número de logins em cada período.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.groupBy`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de estatísticas de login ou um erro (500).
 */
const getLoginStats = async (req, res) => {
    const groupBy = req.query.groupBy || 'day';
    logger_1.default.info(`Requisição para obter estatísticas de login`, { groupBy });
    try {
        const groupStageId = getGroupStage(groupBy);
        const stats = await LoginEvent_1.default.aggregate([
            { $group: { ...groupStageId, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
            { $project: { _id: 0, period: '$_id', count: 1 } }
        ]);
        logger_1.default.info(`Estatísticas de login por ${groupBy} coletadas com sucesso.`);
        res.status(200).json(stats);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter estatísticas de login:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, groupBy });
        res.status(500).json({ message: 'Erro ao buscar estatísticas de login' });
    }
};
exports.getLoginStats = getLoginStats;
/**
 * @function getUploadStats
 * @description Controladora para obter estatísticas de uploads de arquivos,
 * como contagem de uploads e tamanho total, agrupadas por período de tempo.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.groupBy`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de estatísticas de upload ou um erro (500).
 */
const getUploadStats = async (req, res) => {
    const groupBy = req.query.groupBy || 'day';
    logger_1.default.info(`Requisição para obter estatísticas de upload`, { groupBy });
    try {
        const groupStageId = getGroupStage(groupBy);
        const stats = await UploadLog_1.default.aggregate([
            { $group: { ...groupStageId, totalSize: { $sum: '$fileSize' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
            { $project: { _id: 0, period: '$_id', totalSize: 1, count: 1 } }
        ]);
        logger_1.default.info(`Estatísticas de upload por ${groupBy} coletadas com sucesso.`);
        res.status(200).json(stats);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter estatísticas de upload:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined, groupBy });
        res.status(500).json({ message: 'Erro ao buscar estatísticas de upload' });
    }
};
exports.getUploadStats = getUploadStats;
/**
 * @function getErrorLogs
 * @description Controladora para buscar os logs de erro mais recentes armazenados no banco de dados
 * (presumivelmente pela biblioteca Winston com transporte MongoDB).
 * Implementa paginação para lidar com grandes volumes de logs.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit` e `req.query.page`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um objeto contendo os logs de erro paginados e informações de paginação, ou um erro (500).
 */
const getErrorLogs = async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    logger_1.default.info(`Requisição para obter logs de erro`, { limit, page });
    try {
        const activities = await UserActivity_1.UserActivity.find();
        const errors = await UserActivity_1.UserActivity
            .find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const totalErrors = await UserActivity_1.UserActivity.countDocuments();
        logger_1.default.info(`Encontrados ${errors.length} logs de erro (página ${page}). Total: ${totalErrors}.`);
        res.status(200).json({
            errors,
            totalErrors,
            currentPage: page,
            totalPages: Math.ceil(totalErrors / limit)
        });
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('ns not found')) {
            logger_1.default.warn('Coleção errorLogs não encontrada. Verifique a configuração do logger MongoDB. Retornando array vazio.');
            res.status(200).json({ errors: [], totalErrors: 0, currentPage: 1, totalPages: 0 });
            return;
        }
        logger_1.default.error('Erro ao obter logs de erro:', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            limit,
            page
        });
        res.status(500).json({ message: 'Erro ao buscar logs de erro' });
    }
};
exports.getErrorLogs = getErrorLogs;
