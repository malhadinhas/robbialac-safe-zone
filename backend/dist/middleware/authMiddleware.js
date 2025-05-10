"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.isAdmin = exports.isAuthenticated = void 0;
const auth_1 = require("../services/auth");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware para verificar se o usuário está autenticado
 * - Se BYPASS_AUTH estiver ativo, simula um utilizador admin para facilitar testes.
 * - Caso contrário, verifica se existe um token JWT válido no header Authorization.
 * - Se o token for válido, adiciona os dados do utilizador ao objeto req.user.
 */
const isAuthenticated = async (req, res, next) => {
    try {
        // Sempre verificar o token JWT
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
            logger_1.default.warn('Formato de token inválido', {
                authorization: authHeader,
                path: req.path
            });
            return res.status(401).json({ message: 'Formato de token inválido' });
        }
        const decodedToken = await (0, auth_1.verifyToken)(token);
        if (!decodedToken) {
            logger_1.default.warn('Token inválido ou expirado', {
                path: req.path,
                method: req.method
            });
            return res.status(401).json({ message: 'Token inválido ou expirado' });
        }
        req.user = decodedToken;
        logger_1.default.info('Usuário autenticado com sucesso', {
            userId: decodedToken.id,
            path: req.path
        });
        next();
    }
    catch (error) {
        logger_1.default.error('Erro ao verificar autenticação', {
            error: error.message,
            path: req.path,
            method: req.method,
            stack: error.stack
        });
        res.status(500).json({ message: 'Erro ao verificar autenticação' });
    }
};
exports.isAuthenticated = isAuthenticated;
/**
 * Middleware para verificar se o usuário é um administrador
 * - Usa o isAuthenticated para garantir que o utilizador está autenticado.
 * - Verifica se o papel do utilizador é 'admin_app' ou 'admin_qa'.
 * - Se não for admin, retorna 403 (acesso não autorizado).
 */
const isAdmin = async (req, res, next) => {
    try {
        // Bypass de autenticação para desenvolvimento
        if (process.env.BYPASS_AUTH === 'true') {
            logger_1.default.warn('BYPASS_AUTH ativado: Pulando verificação de admin');
            req.user = {
                id: 'dev-admin',
                email: 'admin@robbialac.pt',
                role: 'admin_app'
            };
            return next();
        }
        // Primeiro verifica se o usuário está autenticado
        await (0, exports.isAuthenticated)(req, res, () => {
            if (!req.user) {
                return res.status(401).json({ message: 'Usuário não autenticado' });
            }
            // Verifica se o usuário tem papel de administrador
            if (req.user.role !== 'admin_app' && req.user.role !== 'admin_qa') {
                logger_1.default.warn('Acesso não autorizado a rota de administrador', {
                    userId: req.user.id,
                    role: req.user.role,
                    path: req.path
                });
                return res.status(403).json({ message: 'Acesso não autorizado' });
            }
            logger_1.default.info('Acesso de administrador autorizado', {
                userId: req.user.id,
                role: req.user.role,
                path: req.path
            });
            next();
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao verificar permissão de administrador', {
            error: error.message,
            path: req.path,
            method: req.method
        });
        res.status(500).json({ message: 'Erro ao verificar permissão de administrador' });
    }
};
exports.isAdmin = isAdmin;
/**
 * Middleware para verificar permissões específicas de um usuário
 * - Recebe um array de papéis permitidos.
 * - Usa o isAuthenticated para garantir que o utilizador está autenticado.
 * - Verifica se o papel do utilizador está incluído nos papéis permitidos.
 * - Se não estiver, retorna 403 (acesso não autorizado).
 */
const hasRole = (roles) => {
    return async (req, res, next) => {
        try {
            // Bypass de autenticação para desenvolvimento
            if (process.env.BYPASS_AUTH === 'true') {
                logger_1.default.warn('BYPASS_AUTH ativado: Pulando verificação de papéis');
                req.user = {
                    id: 'dev-admin',
                    email: 'admin@robbialac.pt',
                    role: 'admin_app'
                };
                return next();
            }
            // Primeiro verifica se o usuário está autenticado
            await (0, exports.isAuthenticated)(req, res, () => {
                if (!req.user) {
                    return res.status(401).json({ message: 'Usuário não autenticado' });
                }
                // Verifica se o usuário tem um dos papéis permitidos
                if (!roles.includes(req.user.role)) {
                    logger_1.default.warn('Acesso não autorizado para o papel requerido', {
                        userId: req.user.id,
                        role: req.user.role,
                        requiredRoles: roles,
                        path: req.path
                    });
                    return res.status(403).json({ message: 'Acesso não autorizado' });
                }
                logger_1.default.info('Acesso autorizado para papel específico', {
                    userId: req.user.id,
                    role: req.user.role,
                    path: req.path
                });
                next();
            });
        }
        catch (error) {
            logger_1.default.error('Erro ao verificar papel do usuário', {
                error: error.message,
                path: req.path,
                method: req.method
            });
            res.status(500).json({ message: 'Erro ao verificar papel do usuário' });
        }
    };
};
exports.hasRole = hasRole;
// -----------------------------------------------------------------------------
// Este ficheiro define middlewares de autenticação e autorização para proteger as rotas da API.
// Permite garantir que apenas utilizadores autenticados e/ou com permissões adequadas conseguem aceder a determinadas rotas.
// - isAuthenticated: Garante que o utilizador tem um token JWT válido.
// - isAdmin: Garante que o utilizador está autenticado e tem papel de administrador.
// - hasRole: Permite definir dinamicamente quais papéis podem aceder a uma rota.
// O objetivo é centralizar toda a lógica de autenticação e autorização, tornando a aplicação mais segura e fácil de manter. 
