"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidents = getIncidents;
exports.getIncidentById = getIncidentById;
exports.createIncident = createIncident;
exports.updateIncident = updateIncident;
exports.deleteIncident = deleteIncident;
exports.getIncidentsByDepartment = getIncidentsByDepartment;
exports.getRecentIncidents = getRecentIncidents;
exports.likeIncident = likeIncident;
exports.commentIncident = commentIncident;
exports.getIncidentsByUser = getIncidentsByUser;
const logger_1 = __importDefault(require("../utils/logger"));
const Incident_1 = __importDefault(require("../models/Incident"));
const Department_1 = __importDefault(require("../models/Department"));
const mongoose_1 = require("mongoose");
/**
 * @function getIncidents
 * @description Controladora para buscar uma lista de incidentes.
 * Permite filtrar por status ('archived', 'not_archived') através de query param.
 * Ordena os resultados pela data mais recente.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.status`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON de incidentes ou um erro (500).
 */
async function getIncidents(req, res) {
    try {
        const statusFilter = req.query.status;
        let query = {};
        if (statusFilter === 'not_archived') {
            query = { status: { $ne: 'Arquivado' } };
            logger_1.default.info('Buscando incidentes não arquivados...');
        }
        else if (statusFilter === 'archived') {
            query = { status: 'Arquivado' };
            logger_1.default.info('Buscando incidentes arquivados...');
        }
        else {
            logger_1.default.info('Buscando todos os incidentes (sem filtro de status)...');
        }
        const incidents = await Incident_1.default.find(query)
            .populate('department', 'name')
            .populate('reportedBy', 'name email')
            .lean();
        const formattedIncidents = incidents.map(incident => ({
            ...incident,
            likes: incident.likes?.length || 0,
            comments: incident.comments?.length || 0
        }));
        logger_1.default.info(`Encontrados ${incidents.length} incidentes com filtro '${statusFilter || 'nenhum'}'`);
        res.json(formattedIncidents);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidentes:', error);
        res.status(500).json({ message: 'Erro ao buscar incidentes' });
    }
}
/**
 * @function getIncidentById
 * @description Controladora para buscar um único incidente pelo seu _id (ObjectId).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o documento do incidente encontrado ou um erro (400, 404, 500).
 */
async function getIncidentById(req, res) {
    try {
        const { id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de acesso com ID inválido', { id });
            res.status(400).json({ message: 'ID de incidente inválido' });
            return;
        }
        const incident = await Incident_1.default.findById(id)
            .populate('department', 'name')
            .populate('reportedBy', 'name email')
            .lean();
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado', { id });
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        const formattedIncident = {
            ...incident,
            likes: incident.likes?.length || 0,
            comments: incident.comments?.length || 0
        };
        logger_1.default.info('Incidente encontrado', { id });
        res.json(formattedIncident);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter incidente:', error);
        res.status(500).json({ message: 'Erro ao obter incidente' });
    }
}
/**
 * @function createIncident
 * @description Controladora para criar um novo registro de incidente.
 * Recebe os dados do incidente via `req.body`.
 * Valida campos obrigatórios e a data.
 * Obtém o email do usuário autenticado (`req.user`) para o campo `reportedBy`.
 * Verifica se o departamento fornecido existe na coleção 'departments'; se não existir, cria-o automaticamente.
 * Gera um UUID para o campo `id`.
 * Define valores padrão para campos como `status` e `severity`.
 * Insere o novo incidente na coleção 'incidents'.
 * @param {Request & { user?: { email: string } }} req - Objeto da requisição Express, estendido para potencialmente incluir `req.user`.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o incidente criado (status 201) ou um erro (400, 401, 500).
 */
async function createIncident(req, res) {
    try {
        const { title, description, location, department, severity, type } = req.body;
        if (!title || !description || !location || !department || !severity || !type) {
            logger_1.default.warn('Tentativa de criar incidente com dados incompletos');
            res.status(400).json({ message: 'Todos os campos são obrigatórios' });
            return;
        }
        let departmentDoc = await Department_1.default.findOne({ name: department });
        if (!departmentDoc) {
            departmentDoc = await Department_1.default.create({ name: department });
            logger_1.default.info('Novo departamento criado', { name: department });
        }
        const incident = new Incident_1.default({
            title,
            description,
            location,
            department: departmentDoc._id,
            severity,
            type,
            reportedBy: req.user?.email,
            status: 'open',
            createdAt: new Date()
        });
        await incident.save();
        const populatedIncident = await Incident_1.default.findById(incident._id)
            .populate('department', 'name')
            .populate('reportedBy', 'name email')
            .lean();
        logger_1.default.info('Incidente criado com sucesso', { id: incident._id });
        res.status(201).json(populatedIncident);
    }
    catch (error) {
        logger_1.default.error('Erro ao criar incidente:', error);
        res.status(500).json({ message: 'Erro ao criar incidente' });
    }
}
/**
 * @function updateIncident
 * @description Controladora para atualizar um incidente existente pelo seu _id (ObjectId).
 * Recebe os campos a serem atualizados no `req.body`.
 * Atualiza apenas os campos fornecidos usando o operador `$set`.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId` e `req.body` com os dados a atualizar).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o incidente atualizado ou um erro (400, 404, 500).
 */
async function updateIncident(req, res) {
    try {
        const { id } = req.params;
        const updateData = req.body;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de atualizar incidente com ID inválido', { id });
            res.status(400).json({ message: 'ID de incidente inválido' });
            return;
        }
        if (updateData.department) {
            let departmentDoc = await Department_1.default.findOne({ name: updateData.department });
            if (!departmentDoc) {
                departmentDoc = await Department_1.default.create({ name: updateData.department });
                logger_1.default.info('Novo departamento criado durante atualização', { name: updateData.department });
            }
            updateData.department = departmentDoc._id;
        }
        const incident = await Incident_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .populate('department', 'name')
            .populate('reportedBy', 'name email')
            .lean();
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado para atualização', { id });
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        logger_1.default.info('Incidente atualizado com sucesso', { id });
        res.json(incident);
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar incidente:', error);
        res.status(500).json({ message: 'Erro ao atualizar incidente' });
    }
}
/**
 * @function deleteIncident
 * @description Controladora para deletar um incidente pelo seu _id (ObjectId).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 204 (No Content) em sucesso ou um erro (400, 404, 500).
 */
async function deleteIncident(req, res) {
    try {
        const { id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de excluir incidente com ID inválido', { id });
            res.status(400).json({ message: 'ID de incidente inválido' });
            return;
        }
        const incident = await Incident_1.default.findByIdAndDelete(id);
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado para exclusão', { id });
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        logger_1.default.info('Incidente excluído com sucesso', { id });
        res.json({ message: 'Incidente excluído com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir incidente:', error);
        res.status(500).json({ message: 'Erro ao excluir incidente' });
    }
}
/**
 * @function getIncidentsByDepartment
 * @description Controladora para obter estatísticas de contagem de incidentes agrupados por departamento.
 * Permite filtrar opcionalmente por ano.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.year`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de objetos { department: string, count: number } ou um erro (500).
 */
async function getIncidentsByDepartment(req, res) {
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    logger_1.default.info('Requisição para buscar incidentes por departamento.', { year });
    try {
        let dateCondition = {};
        if (year && !isNaN(year)) {
            const startDate = new Date(year, 0, 1);
            const endDate = new Date(year + 1, 0, 1);
            dateCondition = { date: { $gte: startDate, $lt: endDate } };
            logger_1.default.info(`Aplicando filtro por ano: ${year}`);
        }
        const departments = await Department_1.default.find({});
        logger_1.default.info(`Encontrados ${departments.length} departamentos para processar.`);
        const departmentStats = await Promise.all(departments.map(async (dept) => {
            const query = {
                department: dept.label,
                ...dateCondition
            };
            const count = await Incident_1.default.countDocuments(query);
            logger_1.default.debug(`Contagem para departamento '${dept.label}' (Ano: ${year || 'todos'}): ${count}`);
            return {
                department: dept.label,
                count: count
            };
        }));
        departmentStats.sort((a, b) => b.count - a.count);
        logger_1.default.info(`Estatísticas de incidentes por departamento calculadas com sucesso. Ano: ${year || 'todos'}`);
        res.json(departmentStats);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar estatísticas de incidentes por departamento:', { error, year });
        res.status(500).json({
            error: 'Erro ao buscar estatísticas de incidentes por departamento',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
/**
 * @function getRecentIncidents
 * @description Controladora para buscar os N incidentes mais recentes (ordenados pela data do incidente).
 * Útil para exibir uma lista rápida de novidades ou atividades recentes.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array dos incidentes recentes formatados ou um erro (400, 500).
 */
async function getRecentIncidents(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 5;
        if (limit <= 0) {
            logger_1.default.warn('Limite inválido solicitado para incidentes recentes.', { limit });
            res.status(400).json({ error: 'O limite deve ser um número positivo.' });
            return;
        }
        logger_1.default.info(`Buscando ${limit} incidentes recentes.`);
        const recentIncidents = await Incident_1.default.find({})
            .sort({ date: -1 })
            .limit(limit)
            .select('_id title date');
        const formattedIncidents = recentIncidents.map(inc => ({
            _id: inc._id,
            title: inc.title,
            date: inc.date instanceof Date ? inc.date.toISOString() : inc.date,
        }));
        logger_1.default.info(`Retornando ${formattedIncidents.length} incidentes recentes formatados.`);
        res.json(formattedIncidents);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidentes recentes:', { error, limit: req.query.limit });
        res.status(500).json({
            error: 'Erro ao buscar incidentes recentes',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
async function likeIncident(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            logger_1.default.warn('Tentativa de curtir incidente sem autenticação');
            res.status(401).json({ message: 'Não autorizado' });
            return;
        }
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de curtir incidente com ID inválido', { id });
            res.status(400).json({ message: 'ID de incidente inválido' });
            return;
        }
        const incident = await Incident_1.default.findById(id);
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado para curtir', { id });
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        const hasLiked = incident.likes?.includes(userId);
        if (hasLiked) {
            incident.likes = incident.likes?.filter(id => id.toString() !== userId);
        }
        else {
            incident.likes = [...(incident.likes || []), userId];
        }
        await incident.save();
        logger_1.default.info('Like atualizado com sucesso', { id, userId, action: hasLiked ? 'unlike' : 'like' });
        res.json({
            message: hasLiked ? 'Like removido com sucesso' : 'Like adicionado com sucesso',
            likes: incident.likes?.length || 0
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar like:', error);
        res.status(500).json({ message: 'Erro ao atualizar like' });
    }
}
async function commentIncident(req, res) {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            logger_1.default.warn('Tentativa de comentar incidente sem autenticação');
            res.status(401).json({ message: 'Não autorizado' });
            return;
        }
        if (!content) {
            logger_1.default.warn('Tentativa de comentar incidente sem conteúdo');
            res.status(400).json({ message: 'Conteúdo do comentário é obrigatório' });
            return;
        }
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de comentar incidente com ID inválido', { id });
            res.status(400).json({ message: 'ID de incidente inválido' });
            return;
        }
        const incident = await Incident_1.default.findById(id);
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado para comentar', { id });
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        const comment = {
            content,
            user: userId,
            createdAt: new Date()
        };
        incident.comments = [...(incident.comments || []), comment];
        await incident.save();
        const populatedIncident = await Incident_1.default.findById(id)
            .populate('comments.user', 'name email')
            .lean();
        logger_1.default.info('Comentário adicionado com sucesso', { id, userId });
        res.json({
            message: 'Comentário adicionado com sucesso',
            comments: populatedIncident?.comments || []
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ message: 'Erro ao adicionar comentário' });
    }
}
async function getIncidentsByUser(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            logger_1.default.warn('Tentativa de obter incidentes sem autenticação');
            res.status(401).json({ message: 'Não autorizado' });
            return;
        }
        const incidents = await Incident_1.default.find({ reportedBy: userId })
            .populate('department', 'name')
            .populate('reportedBy', 'name email')
            .lean();
        const formattedIncidents = incidents.map(incident => ({
            ...incident,
            likes: incident.likes?.length || 0,
            comments: incident.comments?.length || 0
        }));
        logger_1.default.info(`Incidentes do usuário recuperados: ${formattedIncidents.length}`, { userId });
        res.json(formattedIncidents);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar incidentes do usuário:', error);
        res.status(500).json({ message: 'Erro ao recuperar incidentes do usuário' });
    }
}
