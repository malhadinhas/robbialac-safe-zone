"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAccessMiddleware = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = require("../services/auth");
const logger_1 = __importDefault(require("../utils/logger"));
// Lista de tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf'
];
// Função para validar o tipo de arquivo
const validateFileType = (filePath) => {
    try {
        const mimeType = require('mime-types').lookup(filePath);
        return ALLOWED_MIME_TYPES.includes(mimeType);
    }
    catch (error) {
        logger_1.default.error('Erro ao validar tipo de arquivo', { error, filePath });
        return false;
    }
};
// Função para sanitizar o nome do arquivo
const sanitizeFileName = (fileName) => {
    return fileName
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres não permitidos
        .replace(/\.{2,}/g, '.') // Remove múltiplos pontos
        .toLowerCase(); // Converte para minúsculas
};
// Middleware de proteção de arquivos
const fileAccessMiddleware = async (req, res, next) => {
    try {
        // Permitir acesso direto se BYPASS_AUTH estiver ativo (apenas para desenvolvimento)
        if (process.env.BYPASS_AUTH === 'true') {
            logger_1.default.warn('BYPASS_AUTH ativo: acesso a ficheiros temporários sem autenticação.');
            return next();
        }
        // Verificar autenticação normalmente em produção
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            logger_1.default.warn('Tentativa de acesso não autorizado a arquivo');
            return res.status(401).json({ error: 'Acesso não autorizado' });
        }
        // Verificar token
        const decoded = await (0, auth_1.verifyToken)(token);
        if (!decoded) {
            logger_1.default.warn('Token inválido ao tentar acessar arquivo');
            return res.status(401).json({ error: 'Token inválido' });
        }
        // Obter caminho do arquivo
        const filePath = path_1.default.join(process.cwd(), 'temp', req.path);
        // Verificar se arquivo existe
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.default.warn('Tentativa de acesso a arquivo inexistente', { filePath });
            return res.status(404).json({ error: 'Arquivo não encontrado' });
        }
        // Validar tipo de arquivo
        if (!validateFileType(filePath)) {
            logger_1.default.warn('Tentativa de acesso a tipo de arquivo não permitido', { filePath });
            return res.status(403).json({ error: 'Tipo de arquivo não permitido' });
        }
        // Adicionar informações do arquivo à requisição
        req.fileInfo = {
            path: filePath,
            sanitizedName: sanitizeFileName(path_1.default.basename(filePath))
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Erro no middleware de acesso a arquivos', { error });
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.fileAccessMiddleware = fileAccessMiddleware;
exports.default = exports.fileAccessMiddleware;
