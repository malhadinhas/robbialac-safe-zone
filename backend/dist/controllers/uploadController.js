"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const storage_1 = require("../services/storage");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const upload = (0, multer_1.default)();
exports.uploadImage = [
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
            }
            const ext = path_1.default.extname(req.file.originalname) || '.jpg';
            const key = `incidents/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
            await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
            const url = await (0, storage_1.getSignedUrl)(key);
            return res.json({ url });
        }
        catch (error) {
            return res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
        }
    }
];
