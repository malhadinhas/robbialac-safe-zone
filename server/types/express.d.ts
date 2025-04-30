import { Request, Response, NextFunction } from 'express';

// Interface para o usuário autenticado
export interface AuthenticatedUser {
  id: string;
  role: string;
  email?: string;
  name?: string;
}

// Extensão da interface Request do Express
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// Tipo para o middleware de autenticação
export type AuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Tipo para o middleware de autorização
export type RoleMiddleware = (
  roles: string[]
) => (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// Tipo para handlers de rota
export type RouteHandler = (
  req: AuthenticatedRequest,
  res: Response
) => Promise<void>; 