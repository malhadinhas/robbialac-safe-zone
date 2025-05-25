import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth';
import logger from '../utils/logger';

// Interface para estender o objeto Request com usuário autenticado
// Isto permite adicionar req.user ao objeto de request do Express
// e usar essa informação em qualquer rota protegida
// (útil para saber quem está autenticado e qual o seu papel)
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

// Flag para desenvolvimento - ativa o bypass de autenticação se em ambiente de desenvolvimento
// Em produção, deve ser false para garantir segurança
const BYPASS_AUTH = process.env.NODE_ENV === 'development';

/**
 * Middleware para verificar se o usuário está autenticado
 * - Se BYPASS_AUTH estiver ativo, simula um utilizador admin para facilitar testes.
 * - Caso contrário, verifica se existe um token JWT válido no header Authorization.
 * - Se o token for válido, adiciona os dados do utilizador ao objeto req.user.
 */
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de autenticação');
      req.user = {
        id: 'dev-admin',
        email: 'admin@robbialac.pt',
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
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }

    const token = authHeader.split(' ')[1]; // Espera formato "Bearer TOKEN"
    
    if (!token) {
      logger.warn('Formato de token inválido', {
        authorization: authHeader,
        path: req.path
      });
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const decodedToken = await verifyToken(token); // Verifica e decodifica o token
    
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
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Bypass de autenticação para desenvolvimento
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de admin');
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
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Bypass de autenticação para desenvolvimento
      if (BYPASS_AUTH) {
        logger.warn('BYPASS_AUTH ativado: Pulando verificação de papéis');
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