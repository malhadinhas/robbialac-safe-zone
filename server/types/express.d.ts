import { Request, Response, NextFunction } from 'express';
// Importa os tipos fundamentais do Express para requests, responses e next (para middlewares).

// Interface para o usuário autenticado
export interface AuthenticatedUser {
  id: string;           // Identificador único do utilizador (pode ser o _id do MongoDB ou UUID)
  userId?: string;      // Alias temporário para compatibilidade
  role: string;         // Papel do utilizador (ex: 'admin_app', 'admin_qa', 'user')
  email?: string;       // Email do utilizador (opcional)
  name?: string;        // Nome do utilizador (opcional)
}

// Extensão da interface Request do Express
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser; // Adiciona a propriedade user ao request, preenchida após autenticação
}

// Tipo para o middleware de autenticação
export type AuthMiddleware = (
  req: AuthenticatedRequest, // Recebe um request já tipado com user
  res: Response,
  next: NextFunction
) => void | Promise<void>;   // Pode ser síncrono ou assíncrono

// Tipo para o middleware de autorização
export type RoleMiddleware = (
  roles: string[]            // Recebe uma lista de papéis permitidos
) => (
  req: AuthenticatedRequest, // Middleware resultante recebe o request autenticado
  res: Response,
  next: NextFunction
) => void | Promise<void>;   // Pode ser síncrono ou assíncrono

// Tipo para handlers de rota
export type RouteHandler = (
  req: AuthenticatedRequest, // Handler recebe o request autenticado
  res: Response
) => Promise<void>;          // Handler é sempre assíncrono (Promise) 