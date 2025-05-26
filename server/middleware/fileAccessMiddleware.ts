import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { verifyToken } from '../services/auth';
import logger from '../utils/logger';

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
const validateFileType = (filePath: string): boolean => {
  try {
    const mimeType = mime.lookup(filePath);
    return ALLOWED_MIME_TYPES.includes(mimeType as string);
  } catch (error) {
    logger.error('Erro ao validar tipo de arquivo', { error, filePath });
    return false;
  }
};

// Função para sanitizar o nome do arquivo
const sanitizeFileName = (fileName: string): string => {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres não permitidos
    .replace(/\.{2,}/g, '.')         // Remove múltiplos pontos
    .toLowerCase();                  // Converte para minúsculas
};

interface FileAccessRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
  fileInfo?: {
    path: string;
    sanitizedName: string;
  };
}

// Middleware de proteção de arquivos
export const fileAccessMiddleware = async (req: FileAccessRequest, res: Response, next: NextFunction): Promise<void> => {
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
      logger.warn('Tentativa de acesso não autorizado a arquivo');
      res.status(401).json({ error: 'Acesso não autorizado' });
      return;
    }

    // Verificar token
    const decoded = await verifyToken(token);
    if (!decoded) {
      logger.warn('Token inválido ao tentar acessar arquivo');
      res.status(401).json({ error: 'Token inválido' });
      return;
    }

    // Obter caminho do arquivo
    const filePath = path.join(process.cwd(), 'temp', req.path);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      logger.warn('Tentativa de acesso a arquivo inexistente', { filePath });
      res.status(404).json({ error: 'Arquivo não encontrado' });
      return;
    }

    // Validar tipo de arquivo
    if (!validateFileType(filePath)) {
      logger.warn('Tentativa de acesso a tipo de arquivo não permitido', { filePath });
      res.status(403).json({ error: 'Tipo de arquivo não permitido' });
      return;
    }

    // Adicionar informações do arquivo à requisição
    req.fileInfo = {
      path: filePath,
      sanitizedName: sanitizeFileName(path.basename(filePath))
    };

    next();
  } catch (error: unknown) {
    logger.error('Erro no middleware de acesso a arquivos', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

export default fileAccessMiddleware; 