"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivities = getUserActivities;
exports.registerActivity = registerActivity;
exports.getFeed = getFeed;
const UserActivity_1 = require("../models/UserActivity");
const logger_1 = __importDefault(require("../utils/logger"));
const medalController_1 = require("./medalController");
async function getUserActivities(req, res) {
    try {
        const userId = req.params.id;
        const activities = await UserActivity_1.UserActivity.find({ userId }).lean();
        const formattedActivities = activities.map((activity) => {
            const count = Number(activity.details?.count ?? 0);
            return {
                description: generateActivityDescription(activity),
                date: new Date(activity.timestamp).toLocaleDateString(),
                action: activity.action,
                category: activity.category,
                activityId: activity._id.toString(),
                points: activity.points || 0
            };
        });
        res.json(formattedActivities);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar atividades do usuário:', { error });
        res.status(500).json({ error: 'Erro ao buscar atividades' });
    }
}
function generateActivityDescription(activity) {
    const count = Number(activity.details?.count ?? 0);
    const category = activity.category;
    if (category === 'incident' && count > 1) {
        return `Participou de ${count} incidentes`;
    }
    return `Participou de uma atividade na categoria ${category}`;
}
// NOVA: Registar uma atividade
async function registerActivity(req, res) {
    try {
        const { userId, category, action, details } = req.body;
        if (!userId || !category || !action) {
            res.status(400).json({ message: 'Campos obrigatórios em falta.' });
            return;
        }
        const activity = new UserActivity_1.UserActivity({
            userId,
            category,
            action,
            details,
            timestamp: new Date()
        });
        await activity.save();
        // Verifica se há medalhas a atribuir
        await (0, medalController_1.checkActionBasedMedals)(userId);
        res.status(201).json({ message: 'Atividade registada com sucesso', activity });
    }
    catch (error) {
        logger_1.default.error('Erro ao registar atividade:', error);
        res.status(500).json({ message: 'Erro ao registar atividade' });
    }
}
// NOVA: Obter feed de atividades
async function getFeed(req, res) {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const activities = await UserActivity_1.UserActivity.find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .populate('userId', 'name')
            .lean();
        const formatted = activities.map((activity) => ({
            id: activity._id,
            userName: activity.userId?.name || 'Utilizador',
            category: activity.category,
            action: activity.action,
            details: activity.details,
            timestamp: activity.timestamp
        }));
        res.json(formatted);
    }
    catch (error) {
        logger_1.default.error('Erro ao carregar feed de atividades:', error);
        res.status(500).json({ message: 'Erro ao carregar feed' });
    }
}
