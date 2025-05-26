"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRanking = exports.getUserPoints = void 0;
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const UserActivity_1 = require("../models/UserActivity");
// Cores associadas a cada categoria
const categoryColors = {
    video: '#007bff',
    incident: '#dc3545',
    training: '#28a745'
};
const getUserPoints = async (req, res) => {
    try {
        const userId = req.params.id;
        const activities = await UserActivity_1.UserActivity.find({ userId }).lean();
        const pointsByCategory = {};
        activities.forEach((activity) => {
            const category = activity.category || 'unknown';
            pointsByCategory[category] = (pointsByCategory[category] || 0) + (activity.points || 0);
        });
        const breakdown = Object.entries(pointsByCategory).map(([category, points]) => ({
            category,
            points,
            color: categoryColors[category] || '#6c757d' // cinzento como cor default
        }));
        res.status(200).json(breakdown);
    }
    catch (err) {
        logger_1.default.error('Erro ao calcular pontos por categoria:', err);
        res.status(500).json({ error: 'Erro interno ao calcular pontos' });
    }
};
exports.getUserPoints = getUserPoints;
const getUserRanking = async (req, res) => {
    try {
        const allUsers = await User_1.default.find({}).lean();
        const userScores = await Promise.all(allUsers.map(async (user) => {
            const activities = await UserActivity_1.UserActivity.find({ userId: user._id }).lean();
            const totalPoints = activities.reduce((sum, act) => sum + (act.points || 0), 0);
            return {
                userId: user._id,
                totalPoints
            };
        }));
        userScores.sort((a, b) => b.totalPoints - a.totalPoints);
        const userId = req.params.id;
        const userIndex = userScores.findIndex(score => score.userId.toString() === userId);
        const userRanking = {
            position: userIndex + 1,
            totalUsers: userScores.length,
            points: userScores[userIndex]?.totalPoints || 0
        };
        res.status(200).json(userRanking);
    }
    catch (err) {
        logger_1.default.error('Erro ao calcular ranking de utilizador:', err);
        res.status(500).json({ error: 'Erro interno ao calcular ranking' });
    }
};
exports.getUserRanking = getUserRanking;
