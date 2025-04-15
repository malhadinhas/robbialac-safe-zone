import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { storageConfig } from '../config/storage';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DURATION = 3600; // 1 hora em segundos

// Criar diretório temporário se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  logger.info(`Diretório temporário criado: ${TEMP_DIR}`);
}

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageConfig.tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = storageConfig.generateFileName(file.originalname);
    cb(null, uniqueId);
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

// Filtro de arquivos
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!storageConfig.allowedExtensions.includes(ext)) {
    logger.warn('Tipo de arquivo não permitido', { 
      filename: file.originalname,
      mimetype: file.mimetype 
    });
    return cb(new Error('Tipo de arquivo não permitido'));
  }
  
  if (!storageConfig.allowedMimeTypes.includes(file.mimetype)) {
    logger.warn('MIME type não permitido', { 
      filename: file.originalname,
      mimetype: file.mimetype 
    });
    return cb(new Error('MIME type não permitido'));
  }
  
  cb(null, true);
};

// Configuração do multer
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: storageConfig.maxFileSize,
    files: 1
  }
});

// Exportar upload como uploadVideo para compatibilidade
export const uploadVideo = upload.single('video');

// Middleware para validação pós-upload
export const validateUploadedVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Validando vídeo após upload', {
      file: req.file ? {
        filename: req.file.filename,
        size: req.file.size,
        path: req.file.path
      } : null,
      body: req.body
    });
    
    if (!req.file) {
      logger.error('Nenhum arquivo enviado');
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Validar campos obrigatórios
    const requiredFields = ['title', 'description', 'category', 'zone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Campos obrigatórios ausentes', { missingFields });
      
      // Limpar arquivo em caso de erro
      try {
        await fs.promises.unlink(req.file.path);
        logger.info('Arquivo removido após erro de validação', {
          path: req.file.path
        });
      } catch (unlinkError) {
        logger.error('Erro ao remover arquivo', { error: unlinkError });
      }
      
      return res.status(400).json({ 
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      });
    }

    logger.info('Iniciando validação pós-upload', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname
    });

    // Validar o vídeo após o upload
    try {
      await validateVideo(req.file.path);
      logger.info('Validação pós-upload concluída com sucesso', {
        filename: req.file.filename
      });
      next();
    } catch (error) {
      // Limpar arquivo em caso de erro
      try {
        await fs.promises.unlink(req.file.path);
        logger.info('Arquivo removido após erro de validação', {
          path: req.file.path
        });
      } catch (unlinkError) {
        logger.error('Erro ao remover arquivo', { error: unlinkError });
      }
      
      logger.error('Erro na validação do vídeo', { 
        error,
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      
      return res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
      });
    }
  } catch (error) {
    // Limpar arquivo em caso de erro
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
        logger.info('Arquivo removido após erro de validação', {
          path: req.file.path
        });
      } catch (unlinkError) {
        logger.error('Erro ao remover arquivo', { error: unlinkError });
      }
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

// Middleware de tratamento de erros
export const handleUploadError = (err: any, req: Express.Request, res: Express.Response, next: Function) => {
  if (err instanceof multer.MulterError) {
    logger.error('Erro no upload', { error: err });
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'Arquivo muito grande. O tamanho máximo permitido é 10GB.' 
      });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
}; 