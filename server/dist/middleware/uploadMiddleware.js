"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const storage_1 = require("../config/storage");
// Diretório temporário para uploads
const TEMP_DIR = path_1.default.join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_DURATION = 3600; // 1 hora em segundos
if (!fs_1.default.existsSync(TEMP_DIR)) {
    fs_1.default.mkdirSync(TEMP_DIR, { recursive: true });
    logger_1.default.info(`Diretório temporário criado: ${TEMP_DIR}`);
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storage_1.storageConfig.tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = storage_1.storageConfig.generateFileName(file.originalname);
        cb(null, uniqueId);
    }
});
const validateVideo = async (filePath) => {
    logger_1.default.info('Iniciando validação do vídeo', { filePath });
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.default.error('Arquivo não encontrado', { filePath });
            reject(new Error('Arquivo não encontrado'));
            return;
        }
        const stats = fs_1.default.statSync(filePath);
        if (stats.size > MAX_FILE_SIZE) {
            logger_1.default.warn('Arquivo excede o tamanho máximo permitido', { size: stats.size });
            reject(new Error('Arquivo excede o tamanho máximo permitido'));
            return;
        }
        // Suporte futuro para validação de duração via ffmpeg
        resolve(true);
    });
};
// O tipo padrão de `multer.FileFilterCallback` é suficiente e compatível com Request
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/ogg', 'video/webm'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        logger_1.default.warn('Tipo de ficheiro não permitido', { mimetype: file.mimetype });
        cb(new Error('Tipo de ficheiro não permitido'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});
