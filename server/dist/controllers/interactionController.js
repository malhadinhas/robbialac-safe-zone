"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.addLike = void 0;
const Like_1 = __importDefault(require("../models/Like"));
const Comment_1 = __importDefault(require("../models/Comment"));
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
const logActivity_1 = require("../utils/logActivity"); // ✅ NOVO
const isValidItemType = (type) => {
    return ['qa', 'accident', 'sensibilizacao'].includes(type);
};
// --- Likes ---
const addLike = async (req, res) => {
    try {
        const { itemId, itemType } = req.body;
        const userId = req.user?.id;
        if (!userId || !(0, mongoose_1.isValidObjectId)(itemId) || !isValidItemType(itemType)) {
            return res.status(400).json({ message: 'Dados inválidos' });
        }
        const likeExists = await Like_1.default.findOne({ itemId, userId, itemType });
        if (likeExists) {
            return res.status(409).json({ message: 'Já gostaste deste item' });
        }
        const like = new Like_1.default({ itemId, userId, itemType });
        await like.save();
        await (0, logActivity_1.logActivity)({
            userId,
            category: 'interaction',
            action: 'like',
            details: { itemType, itemId }
        });
        res.status(201).json({ message: 'Like registado com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao adicionar like:', error);
        res.status(500).json({ message: 'Erro ao adicionar like' });
    }
};
exports.addLike = addLike;
// --- Comentários ---
const addComment = async (req, res) => {
    try {
        const { itemId, itemType, text } = req.body;
        const userId = req.user?.id;
        if (!userId || !(0, mongoose_1.isValidObjectId)(itemId) || !isValidItemType(itemType) || !text) {
            return res.status(400).json({ message: 'Dados inválidos para comentário' });
        }
        const comment = new Comment_1.default({ itemId, itemType, userId, text });
        await comment.save();
        await (0, logActivity_1.logActivity)({
            userId,
            category: 'interaction',
            action: 'comment',
            details: { itemType, itemId, text }
        });
        res.status(201).json({ message: 'Comentário adicionado com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao adicionar comentário:', error);
        res.status(500).json({ message: 'Erro interno ao adicionar comentário' });
    }
};
exports.addComment = addComment;
