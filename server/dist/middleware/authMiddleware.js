"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.isAdmin = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = require("../config");
const BYPASS_AUTH = process.env.NODE_ENV === 'development';
const isAuthenticated = async (req, res, next) => {
    try {
        if (BYPASS_AUTH) {
            logger_1.default.warn('BYPASS_AUTH ativado: Pulando verificação de autenticação');
            req.user = {
                userId: 'dev-admin',
                role: 'admin_app'
            };
            return next();
        }
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            logger_1.default.warn('Tentativa de acesso sem token de autenticação', {
                path: req.path,
                method: req.method
            });
            return res.status(401).json({ message: 'Token de autenticação não fornecido' });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            logger_1.default.warn('Formato de token inválido');
            return res.status(401).json({ message: 'Formato de token inválido' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
            return res.status(401).json({ message: 'Token inválido ou malformado' });
        }
        const decodedToken = decoded;
        req.user = {
            userId: decodedToken.userId,
            role: decodedToken.role
        };
        next();
    }
    catch (error) {
        logger_1.default.error('Erro na autenticação JWT:', error);
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};
exports.isAuthenticated = isAuthenticated;
// ✅ Middleware para admins
const isAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin_app' && req.user?.role !== 'admin_qa') {
        return res.status(403).json({ message: 'Acesso negado' });
    }
    next();
};
exports.isAdmin = isAdmin;
// ✅ Middleware baseado em array de roles
const hasRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Permissão insuficiente' });
        }
        next();
    };
};
exports.hasRole = hasRole;
