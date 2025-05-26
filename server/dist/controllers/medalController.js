"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkActionBasedMedals = exports.assignMedalToUser = exports.getAllMedals = void 0;
const Medal_1 = __importDefault(require("../models/Medal"));
const logger_1 = __importDefault(require("../utils/logger"));
const UserActivity_1 = require("../models/UserActivity");
const UserMedal_1 = __importDefault(require("../models/UserMedal"));
const getAllMedals = async (_req, res) => {
    try {
        const medals = await Medal_1.default.find().lean();
        res.json(medals);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar medalhas:', error);
        res.status(500).json({ message: 'Erro ao buscar medalhas' });
    }
};
exports.getAllMedals = getAllMedals;
const assignMedalToUser = async (userId, medalId) => {
    try {
        const existing = await UserMedal_1.default.findOne({ userId, medalId });
        if (!existing) {
            await new UserMedal_1.default({ userId, medalId }).save();
            logger_1.default.info(`Medalha ${medalId} atribuída ao utilizador ${userId}`);
        }
    }
    catch (error) {
        logger_1.default.error('Erro ao atribuir medalha:', error);
    }
};
exports.assignMedalToUser = assignMedalToUser;
const checkActionBasedMedals = async (userId) => {
    try {
        const allMedals = await Medal_1.default.find().lean();
        const activities = await UserActivity_1.UserActivity.find({ userId }).lean();
        for (const medal of allMedals) {
            const relevant = activities.filter((a) => a.category === 'interaction' &&
                a.action === medal.triggerAction &&
                (!medal.triggerCategory || a.details?.category === medal.triggerCategory));
            const count = relevant.length;
            const required = medal.requiredCount ?? 1;
            if (count >= required) {
                await (0, exports.assignMedalToUser)(userId, medal.id);
            }
        }
    }
    catch (error) {
        logger_1.default.error('Erro ao verificar atribuição automática de medalhas:', error);
    }
};
exports.checkActionBasedMedals = checkActionBasedMedals;
