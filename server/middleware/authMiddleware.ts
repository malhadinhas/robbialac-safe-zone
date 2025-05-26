import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { config } from '../config';
import { JwtPayload as DefaultJwtPayload } from 'jsonwebtoken';

interface JwtPayload extends DefaultJwtPayload {
  userId: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

const BYPASS_AUTH = process.env.NODE_ENV === 'development';

export const isAuthenticated = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (BYPASS_AUTH) {
      logger.warn('BYPASS_AUTH ativado: Pulando verificação de autenticação');
      req.user = {
        userId: 'dev-admin',
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

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Formato de token inválido');
      return res.status(401).json({ message: 'Formato de token inválido' });
    }

    const decoded = jwt.verify(token, config.jwtSecret);

    if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
      return res.status(401).json({ message: 'Token inválido ou malformado' });
    }

    const decodedToken = decoded as JwtPayload;

    req.user = {
      userId: decodedToken.userId,
      role: decodedToken.role
    };

    next();
  } catch (error) {
    logger.error('Erro na autenticação JWT:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

// ✅ Middleware para admins
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin_app' && req.user?.role !== 'admin_qa') {
    return res.status(403).json({ message: 'Acesso negado' });
  }
  next();
};

// ✅ Middleware baseado em array de roles
export const hasRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Permissão insuficiente' });
    }
    next();
  };
};
