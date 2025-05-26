import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { config } from '../config';
import { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';

// Interface para estender o objeto Request com usuário autenticado
// Isto permite adicionar req.user ao objeto de request do Express
// e usar essa informação em qualquer rota protegida
// (útil para saber quem está autenticado e qual o seu papel)
interface JwtPayload extends DefaultJwtPayload {
  userId: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Flag para desenvolvimento - ativa o bypass de autenticação se em ambiente de desenvolvimento
// Em produção, deve ser false para garantir segurança
const BYPASS_AUTH = process.env.NODE_ENV === 'development';

/**
 * Middleware para verificar se o usuário está autenticado
 * - Se BYPASS_AUTH estiver ativo, simula um utilizador admin para facilitar testes.
 * - Caso contrário, verifica se existe um token JWT válido no header Authorization.
 * - Se o token for válido, adiciona os dados do utilizador ao objeto req.user.
 */
export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de autenticação');
      req.user = {
        userId: 'dev-admin',
        role: 'admin_app'
      };
      return next();
    }

    const authHeader = req.headers.authorization; // Lê o header Authorization
    
    if (!authHeader) {
      logger.warn('Tentativa de acesso sem token de autenticação', { 
        path: req.path,
        method: req.method
      });
      res.status(401).json({ message: 'Token de autenticação não fornecido' });
      return;
    }

    const token = authHeader.split(' ')[1]; // Espera formato "Bearer TOKEN"
    
    if (!token) {
      logger.warn('Formato de token inválido', {
        authorization: authHeader,
        path: req.path
      });
      res.status(401).json({ message: 'Formato de token inválido' });
      return;
    }

    const decodedToken = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    if (!decodedToken) {
      logger.warn('Token inválido ou expirado', {
        path: req.path,
        method: req.method
      });
      res.status(401).json({ message: 'Token inválido ou expirado' });
      return;
    }

    // Adiciona informações do usuário ao objeto de requisição
    req.user = { id: decodedToken.userId, role: decodedToken.role };
    
    logger.info('Usuário autenticado com sucesso', { 
      userId: decodedToken.userId,
      path: req.path
    });
    next();
  } catch (error: unknown) {
    logger.error('Erro ao verificar autenticação', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ message: 'Erro ao verificar autenticação' });
  }
};

/**
 * Middleware para verificar se o usuário é um administrador
 * - Usa o isAuthenticated para garantir que o utilizador está autenticado.
 * - Verifica se o papel do utilizador é 'admin_app' ou 'admin_qa'.
 * - Se não for admin, retorna 403 (acesso não autorizado).
 */
export const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de admin');
      req.user = {
        userId: 'dev-admin',
        role: 'admin_app'
      };
      return next();
    }

    // Primeiro verifica se o usuário está autenticado
    await isAuthenticated(req, res, () => {
      if (!req.user) {
        res.status(401).json({ message: 'Usuário não autenticado' });
        return;
      }

      // Verifica se o usuário tem papel de administrador
      if (req.user.role !== 'admin_app' && req.user.role !== 'admin_qa') {
        logger.warn('Acesso não autorizado a rota de administrador', { 
          userId: req.user.userId, 
          role: req.user.role,
          path: req.path
        });
        res.status(403).json({ message: 'Acesso não autorizado' });
        return;
      }

      logger.info('Acesso de administrador autorizado', { 
        userId: req.user.userId, 
        role: req.user.role,
        path: req.path
      });
      next();
    });
  } catch (error: unknown) {
    logger.error('Erro ao verificar permissão de administrador', { 
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
      method: req.method,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ message: 'Erro ao verificar permissão de administrador' });
  }
};

/**
 * Middleware para verificar permissões específicas de um usuário
 * - Recebe um array de papéis permitidos.
 * - Usa o isAuthenticated para garantir que o utilizador está autenticado.
 * - Verifica se o papel do utilizador está incluído nos papéis permitidos.
 * - Se não estiver, retorna 403 (acesso não autorizado).
 */
export const hasRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Bypass de autenticação para desenvolvimento
      if (BYPASS_AUTH) {
        logger.warn('BYPASS_AUTH ativado: Pulando verificação de papéis');
        req.user = {
          userId: 'dev-admin',
          role: 'admin_app'
        };
        return next();
      }

      // Primeiro verifica se o usuário está autenticado
      await isAuthenticated(req, res, () => {
        if (!req.user) {
          res.status(401).json({ message: 'Usuário não autenticado' });
          return;
        }

        // Verifica se o usuário tem um dos papéis permitidos
        if (!roles.includes(req.user.role)) {
          logger.warn('Acesso não autorizado para o papel requerido', { 
            userId: req.user.userId, 
            role: req.user.role,
            requiredRoles: roles,
            path: req.path
          });
          res.status(403).json({ message: 'Acesso não autorizado' });
          return;
        }

        logger.info('Acesso autorizado para papel específico', { 
          userId: req.user.userId, 
          role: req.user.role,
          path: req.path
        });
        next();
      });
    } catch (error: unknown) {
      logger.error('Erro ao verificar papel do usuário', { 
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Erro ao verificar papel do usuário' });
    }
  };
};

// -----------------------------------------------------------------------------
// Este ficheiro define middlewares de autenticação e autorização para proteger as rotas da API.
// Permite garantir que apenas utilizadores autenticados e/ou com permissões adequadas conseguem aceder a determinadas rotas.
// - isAuthenticated: Garante que o utilizador tem um token JWT válido.
// - isAdmin: Garante que o utilizador está autenticado e tem papel de administrador.
// - hasRole: Permite definir dinamicamente quais papéis podem aceder a uma rota.
// O objetivo é centralizar toda a lógica de autenticação e autorização, tornando a aplicação mais segura e fácil de manter. 