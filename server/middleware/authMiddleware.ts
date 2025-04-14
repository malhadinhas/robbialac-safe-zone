import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';
import logger from '../utils/logger';

// Interface para estender o objeto Request com usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Flag para desenvolvimento - FORÇANDO para true para facilitar o desenvolvimento
// Em produção, substitua por: process.env.NODE_ENV === 'development'
const BYPASS_AUTH = true; // Forçado para True durante desenvolvimento

/**
 * Middleware para verificar se o usuário está autenticado
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de autenticação');
      // Atribuir um usuário temporário de admin para desenvolvimento
      req.user = {
        id: 'dev-admin',
        email: 'admin@robbialac.pt',
        role: 'admin_app'
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn('Tentativa de acesso sem token de autenticação', { 
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
    
    if (!token) {
      logger.warn('Formato de token inválido', {
        authorization: authHeader,
        path: req.path
      });
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const decodedToken = await verifyToken(token);
    
    if (!decodedToken) {
      logger.warn('Token inválido ou expirado', {
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ message: 'Token inválido ou expirado' });
    }

    // Adiciona informações do usuário ao objeto de requisição
    req.user = decodedToken;
    
    logger.info('Usuário autenticado com sucesso', { 
      userId: decodedToken.id,
      path: req.path
    });
    next();
  } catch (error: any) {
    logger.error('Erro ao verificar autenticação', { 
      error: error.message,
      path: req.path,
      method: req.method,
      stack: error.stack
    });
    res.status(500).json({ message: 'Erro ao verificar autenticação' });
  }
};

/**
 * Middleware para verificar se o usuário é um administrador
 */
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de admin');
      // Atribuir um usuário temporário de admin para desenvolvimento
      req.user = {
        id: 'dev-admin',
        email: 'admin@robbialac.pt',
        role: 'admin_app'
      };
      return next();
    }

    // Primeiro verifica se o usuário está autenticado
    await isAuthenticated(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ message: 'Usuário não autenticado' });
      }

      // Verifica se o usuário tem papel de administrador
      if (req.user.role !== 'admin_app' && req.user.role !== 'admin_qa') {
        logger.warn('Acesso não autorizado a rota de administrador', { 
          userId: req.user.id, 
          role: req.user.role,
          path: req.path
        });
        return res.status(403).json({ message: 'Acesso não autorizado' });
      }

      logger.info('Acesso de administrador autorizado', { 
        userId: req.user.id, 
        role: req.user.role,
        path: req.path
      });
      next();
    });
  } catch (error: any) {
    logger.error('Erro ao verificar permissão de administrador', { 
      error: error.message,
      path: req.path,
      method: req.method
    });
    res.status(500).json({ message: 'Erro ao verificar permissão de administrador' });
  }
};

/**
 * Middleware para verificar permissões específicas de um usuário
 */
export const hasRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bypass de autenticação para desenvolvimento
      if (BYPASS_AUTH) {
        logger.warn('BYPASS_AUTH ativado: Pulando verificação de papéis');
        // Atribuir um usuário temporário de admin para desenvolvimento
        req.user = {
          id: 'dev-admin',
          email: 'admin@robbialac.pt',
          role: 'admin_app'
        };
        return next();
      }

      // Primeiro verifica se o usuário está autenticado
      await isAuthenticated(req, res, () => {
        if (!req.user) {
          return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        // Verifica se o usuário tem um dos papéis permitidos
        if (!roles.includes(req.user.role)) {
          logger.warn('Acesso não autorizado para o papel requerido', { 
            userId: req.user.id, 
            role: req.user.role,
            requiredRoles: roles,
            path: req.path
          });
          return res.status(403).json({ message: 'Acesso não autorizado' });
        }

        logger.info('Acesso autorizado para papel específico', { 
          userId: req.user.id, 
          role: req.user.role,
          path: req.path
        });
        next();
      });
    } catch (error: any) {
      logger.error('Erro ao verificar papel do usuário', { 
        error: error.message,
        path: req.path,
        method: req.method
      });
      res.status(500).json({ message: 'Erro ao verificar papel do usuário' });
    }
  };
}; 