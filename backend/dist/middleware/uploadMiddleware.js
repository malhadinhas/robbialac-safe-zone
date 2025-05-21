"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.validateUploadedVideo = exports.uploadVideo = exports.upload = void 0;
const multer_1 = __importDefault(require("multer")); // Biblioteca para upload de ficheiros no Express
const path_1 = __importDefault(require("path")); // Utilitário para manipulação de caminhos de ficheiros
const logger_1 = __importDefault(require("../utils/logger")); // Logger para registar informações e erros
const fs_1 = __importDefault(require("fs")); // File system do Node.js
const storage_1 = require("../config/storage"); // Configuração de armazenamento (diretórios, limites, etc.)
// Diretório temporário para uploads
const TEMP_DIR = path_1.default.join(process.cwd(), 'temp');
// Limite máximo de tamanho do ficheiro (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;
// Duração máxima do vídeo (1 hora em segundos)
const MAX_DURATION = 3600;
// Cria o diretório temporário se não existir
if (!fs_1.default.existsSync(TEMP_DIR)) {
    fs_1.default.mkdirSync(TEMP_DIR, { recursive: true });
    logger_1.default.info(`Diretório temporário criado: ${TEMP_DIR}`);
}
// Configuração do armazenamento do multer
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, storage_1.storageConfig.tempDir); // Define o diretório de destino
    },
    filename: (req, file, cb) => {
        const uniqueId = storage_1.storageConfig.generateFileName(file.originalname); // Gera nome único
        cb(null, uniqueId);
    }
});
// Função para validação detalhada do vídeo (tamanho, existência)
const validateVideo = async (filePath) => {
    logger_1.default.info('Iniciando validação do vídeo', { filePath });
    return new Promise((resolve, reject) => {
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.default.error('Arquivo não encontrado', { filePath });
            reject(new Error('Arquivo não encontrado'));
            return;
        }
        // Verifica o tamanho do ficheiro
        const stats = fs_1.default.statSync(filePath);
        if (stats.size > MAX_FILE_SIZE) {
            logger_1.default.warn('Arquivo muito grande', {
                size: stats.size,
                maxSize: MAX_FILE_SIZE
            });
            reject(new Error(`Arquivo muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
            return;
        }
        // Se passou, considera válido
        logger_1.default.info('Arquivo validado com sucesso', {
            size: stats.size,
            path: filePath
        });
        resolve(true);
    });
};
// Filtro de ficheiros para o multer (extensão e MIME type)
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    if (!storage_1.storageConfig.allowedExtensions.includes(ext)) {
        logger_1.default.warn('Tipo de arquivo não permitido', {
            filename: file.originalname,
            mimetype: file.mimetype
        });
        return cb(new Error('Tipo de arquivo não permitido'));
    }
    if (!storage_1.storageConfig.allowedMimeTypes.includes(file.mimetype)) {
        logger_1.default.warn('MIME type não permitido', {
            filename: file.originalname,
            mimetype: file.mimetype
        });
        return cb(new Error('MIME type não permitido'));
    }
    cb(null, true);
};
// Configuração do multer para upload de ficheiros
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: storage_1.storageConfig.maxFileSize,
        files: 1
    }
});
// Exporta o middleware para upload de um único vídeo
exports.uploadVideo = exports.upload.single('video');
// Middleware para validação pós-upload (campos obrigatórios, validação do vídeo)
const validateUploadedVideo = async (req, res, next) => {
    try {
        logger_1.default.info('Validando vídeo após upload', {
            file: req.file ? {
                filename: req.file.filename,
                size: req.file.size,
                path: req.file.path
            } : null,
            body: req.body
        });
        if (!req.file) {
            logger_1.default.error('Nenhum arquivo enviado');
            return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }
        // Verifica se todos os campos obrigatórios estão presentes
        const requiredFields = ['title', 'description', 'category', 'zone'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            logger_1.default.warn('Campos obrigatórios ausentes', { missingFields });
            // Remove o ficheiro se houver erro de validação
            try {
                await fs_1.default.promises.unlink(req.file.path);
                logger_1.default.info('Arquivo removido após erro de validação', {
                    path: req.file.path
                });
            }
            catch (unlinkError) {
                logger_1.default.error('Erro ao remover arquivo', { error: unlinkError });
            }
            return res.status(400).json({
                message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}`
            });
        }
        logger_1.default.info('Iniciando validação pós-upload', {
            filename: req.file.filename,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname
        });
        // Valida o vídeo (tamanho, existência)
        try {
            await validateVideo(req.file.path);
            logger_1.default.info('Validação pós-upload concluída com sucesso', {
                filename: req.file.filename
            });
            next();
        }
        catch (error) {
            // Remove o ficheiro se houver erro de validação
            try {
                await fs_1.default.promises.unlink(req.file.path);
                logger_1.default.info('Arquivo removido após erro de validação', {
                    path: req.file.path
                });
            }
            catch (unlinkError) {
                logger_1.default.error('Erro ao remover arquivo', { error: unlinkError });
            }
            logger_1.default.error('Erro na validação do vídeo', {
                error,
                message: error instanceof Error ? error.message : 'Erro desconhecido'
            });
            return res.status(400).json({
                message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
            });
        }
    }
    catch (error) {
        // Remove o ficheiro se houver erro inesperado
        if (req.file) {
            try {
                await fs_1.default.promises.unlink(req.file.path);
                logger_1.default.info('Arquivo removido após erro de validação', {
                    path: req.file.path
                });
            }
            catch (unlinkError) {
                logger_1.default.error('Erro ao remover arquivo', { error: unlinkError });
            }
        }
        logger_1.default.error('Erro na validação do vídeo', {
            error,
            file: req.file,
            message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        return res.status(400).json({
            message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
        });
    }
};
exports.validateUploadedVideo = validateUploadedVideo;
// Middleware para tratamento de erros do multer (ex: ficheiro muito grande)
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        logger_1.default.error('Erro no upload', { error: err });
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'Arquivo muito grande. O tamanho máximo permitido é 10GB.'
            });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
};
exports.handleUploadError = handleUploadError;
// -----------------------------------------------------------------------------
// Este ficheiro define middlewares para upload, validação e tratamento de erros de ficheiros de vídeo na API Express.
// - upload: Middleware para upload de ficheiros usando multer.
// - uploadVideo: Middleware para upload de um único vídeo.
// - validateUploadedVideo: Middleware para validação pós-upload (campos obrigatórios, tamanho, existência).
// - handleUploadError: Middleware para tratamento de erros do multer.
// O objetivo é garantir que só vídeos válidos e com metadados completos entram no sistema, e que ficheiros inválidos são removidos imediatamente. 
