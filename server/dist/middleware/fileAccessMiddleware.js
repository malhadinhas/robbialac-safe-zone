"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileAccessMiddleware = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const mime_types_1 = __importDefault(require("mime-types"));
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
        const mimeType = mime_types_1.default.lookup(filePath);
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
        const { fileId } = req.params;
        const user = req.user;
        if (!user) {
            res.status(401).json({ message: 'Usuário não autenticado' });
            return;
        }
        // Verifica se o usuário tem permissão para acessar o arquivo
        if (user.role !== 'admin_app' && user.role !== 'admin_qa') {
            res.status(403).json({ message: 'Acesso não autorizado' });
            return;
        }
        // Verificar autenticação
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            logger_1.default.warn('Tentativa de acesso não autorizado a arquivo');
            res.status(401).json({ error: 'Acesso não autorizado' });
            return;
        }
        // Verificar token
        const decoded = await (0, auth_1.verifyToken)(token);
        if (!decoded) {
            logger_1.default.warn('Token inválido ao tentar acessar arquivo');
            res.status(401).json({ error: 'Token inválido' });
            return;
        }
        // Obter caminho do arquivo
        const filePath = path_1.default.join(process.cwd(), 'temp', req.path);
        // Verificar se arquivo existe
        if (!fs_1.default.existsSync(filePath)) {
            logger_1.default.warn('Tentativa de acesso a arquivo inexistente', { filePath });
            res.status(404).json({ error: 'Arquivo não encontrado' });
            return;
        }
        // Validar tipo de arquivo
        if (!validateFileType(filePath)) {
            logger_1.default.warn('Tentativa de acesso a tipo de arquivo não permitido', { filePath });
            res.status(403).json({ error: 'Tipo de arquivo não permitido' });
            return;
        }
        // Adicionar informações do arquivo à requisição
        req.fileInfo = {
            path: filePath,
            sanitizedName: sanitizeFileName(path_1.default.basename(filePath))
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Erro no middleware de acesso a arquivos', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};
exports.fileAccessMiddleware = fileAccessMiddleware;
exports.default = exports.fileAccessMiddleware;
