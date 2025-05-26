"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const storage_1 = require("../services/storage");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const upload = (0, multer_1.default)();
exports.uploadImage = [
    upload.single('image'),
    async (req, res) => {
        try {
            if (!req.file) {
                logger_1.default.warn('Tentativa de upload sem arquivo');
                res.status(400).json({ error: 'Nenhuma imagem enviada.' });
                return;
            }
            const ext = path_1.default.extname(req.file.originalname) || '.jpg';
            const key = `incidents/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
            logger_1.default.info('Iniciando upload para R2', {
                originalName: req.file.originalname,
                key,
                mimeType: req.file.mimetype
            });
            await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
            const url = await (0, storage_1.getSignedUrl)(key);
            logger_1.default.info('Upload concluído com sucesso', { key });
            res.json({ url });
        }
        catch (error) {
            logger_1.default.error('Erro ao fazer upload da imagem:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                originalName: req.file?.originalname
            });
            res.status(500).json({
                error: 'Erro ao fazer upload da imagem.',
                details: error instanceof Error ? error.message : String(error)
            });
        }
    }
];
