import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DURATION = 3600; // 1 hora em segundos

// Criar diretório temporário se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  logger.info(`Diretório temporário criado: ${TEMP_DIR}`);
}

// Configuração do storage para o Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    logger.info('Iniciando upload de arquivo', { 
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, TEMP_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    const newFilename = `${uniqueId}${ext}`;
    logger.info('Gerando nome de arquivo', { 
      originalname: file.originalname,
      newFilename: newFilename
    });
    cb(null, newFilename);
  }
});

// Validação detalhada do arquivo
const validateVideo = async (filePath: string): Promise<boolean> => {
  logger.info('Iniciando validação do vídeo', { filePath });
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      logger.error('Arquivo não encontrado', { filePath });
      reject(new Error('Arquivo não encontrado'));
      return;
    }

    // Verificar tamanho do arquivo
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn('Arquivo muito grande', {
        size: stats.size,
        maxSize: MAX_FILE_SIZE
      });
      reject(new Error(`Arquivo muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
      return;
    }

    // Por enquanto, vamos apenas verificar se o arquivo existe e tem tamanho válido
    logger.info('Arquivo validado com sucesso', {
      size: stats.size,
      path: filePath
    });
    resolve(true);
  });
};

// Filtro de arquivos melhorado
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  try {
    logger.info('Verificando tipo de arquivo', {
      mimetype: file.mimetype,
      originalname: file.originalname
    });

    // Lista de extensões permitidas
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedExtensions.includes(ext)) {
      logger.warn('Extensão de arquivo não permitida', {
        extension: ext,
        originalname: file.originalname,
        allowedExtensions
      });
      cb(new Error('Extensão de arquivo não permitida. Use apenas .mp4, .mov, .avi ou .mkv'));
      return;
    }

    // Aceitar qualquer mimetype que comece com 'video/'
    if (!file.mimetype.startsWith('video/')) {
      logger.warn('Tipo de arquivo não permitido', {
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      cb(new Error('Apenas arquivos de vídeo são permitidos'));
      return;
    }

    logger.info('Arquivo aceito pelo filtro', {
      mimetype: file.mimetype,
      extension: ext,
      originalname: file.originalname
    });
    cb(null, true);
  } catch (error) {
    logger.error('Erro ao validar arquivo', { error });
    cb(error as Error);
  }
};

// Configuração do Multer
export const uploadVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
}).single('video');

// Middleware para validação pós-upload
export const validateUploadedVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      logger.error('Nenhum arquivo enviado');
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    logger.info('Iniciando validação pós-upload', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname
    });

    // Validar o vídeo após o upload
    await validateVideo(req.file.path);
    
    logger.info('Validação pós-upload concluída com sucesso', {
      filename: req.file.filename
    });
    
    next();
  } catch (error) {
    // Limpar arquivo em caso de erro
    if (req.file) {
      logger.info('Removendo arquivo após erro de validação', {
        path: req.file.path
      });
      await fs.promises.unlink(req.file.path).catch((unlinkError) => {
        logger.error('Erro ao remover arquivo', { error: unlinkError });
      });
    }
    
    logger.error('Erro na validação do vídeo', { 
      error,
      file: req.file,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    return res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
    });
  }
};

// Handler de erros do Multer
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (!err) {
    return next();
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      logger.warn('Arquivo muito grande rejeitado', {
        error: err,
        maxSize: MAX_FILE_SIZE
      });
      return res.status(413).json({
        message: `Arquivo muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB`
      });
    }
    logger.error('Erro do Multer', { 
      error: err,
      code: err.code,
      field: err.field
    });
    return res.status(400).json({ 
      message: err.code === 'LIMIT_UNEXPECTED_FILE' 
        ? 'Campo de arquivo inválido. Use o campo "video".'
        : 'Erro no upload do arquivo'
    });
  }
  
  logger.error('Erro no upload', { 
    error: err,
    message: err.message
  });
  return res.status(500).json({ 
    message: err.message || 'Erro interno no servidor durante upload'
  });
}; 