import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
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
    const mimeType = require('mime-types').lookup(filePath);
    return ALLOWED_MIME_TYPES.includes(mimeType);
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

// Middleware de proteção de arquivos
export const fileAccessMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Verificar autenticação
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      logger.warn('Tentativa de acesso não autorizado a arquivo');
      return res.status(401).json({ error: 'Acesso não autorizado' });
    }

    // Verificar token
    const decoded = await verifyToken(token);
    if (!decoded) {
      logger.warn('Token inválido ao tentar acessar arquivo');
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Obter caminho do arquivo
    const filePath = path.join(process.cwd(), 'temp', req.path);
    
    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      logger.warn('Tentativa de acesso a arquivo inexistente', { filePath });
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Validar tipo de arquivo
    if (!validateFileType(filePath)) {
      logger.warn('Tentativa de acesso a tipo de arquivo não permitido', { filePath });
      return res.status(403).json({ error: 'Tipo de arquivo não permitido' });
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