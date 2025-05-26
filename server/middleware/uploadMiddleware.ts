import multer from 'multer'; // Biblioteca para upload de ficheiros no Express
import path from 'path'; // Utilitário para manipulação de caminhos de ficheiros
import { Request, Response, NextFunction } from 'express'; // Tipos do Express
import { v4 as uuidv4 } from 'uuid'; // Para gerar nomes únicos de ficheiros
import logger from '../utils/logger'; // Logger para registar informações e erros
import fs from 'fs'; // File system do Node.js
import ffmpeg from 'fluent-ffmpeg'; // Biblioteca para manipulação de vídeos (não usada diretamente aqui)
import { storageConfig } from '../config/storage'; // Configuração de armazenamento (diretórios, limites, etc.)

// Diretório temporário para uploads
const TEMP_DIR = path.join(process.cwd(), 'temp');
// Limite máximo de tamanho do ficheiro (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;
// Duração máxima do vídeo (1 hora em segundos)
const MAX_DURATION = 3600;

// Cria o diretório temporário se não existir
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  logger.info(`Diretório temporário criado: ${TEMP_DIR}`);
}

// Configuração do armazenamento do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageConfig.tempDir); // Define o diretório de destino
  },
  filename: (req, file, cb) => {
    const uniqueId = storageConfig.generateFileName(file.originalname); // Gera nome único
    cb(null, uniqueId);
  }
});

// Função para validação detalhada do vídeo (tamanho, existência)
const validateVideo = async (filePath: string): Promise<boolean> => {
  logger.info('Iniciando validação do vídeo', { filePath });
  
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      logger.error('Arquivo não encontrado', { filePath });
      reject(new Error('Arquivo não encontrado'));
      return;
    }

    // Verifica o tamanho do ficheiro
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn('Arquivo muito grande', {
        size: stats.size,
        maxSize: MAX_FILE_SIZE
      });
      reject(new Error(`Arquivo muito grande. O tamanho máximo permitido é ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
      return;
    }

    // Se passou, considera válido
    logger.info('Arquivo validado com sucesso', {
      size: stats.size,
      path: filePath
    });
    resolve(true);
  });
};

// Filtro de ficheiros para o multer (extensão e MIME type)
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

// Configuração do multer para upload de ficheiros
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: storageConfig.maxFileSize,
    files: 1
  }
});

// Exporta o middleware para upload de um único vídeo
export const uploadVideo = upload.single('video');

// Middleware para validação pós-upload (campos obrigatórios, validação do vídeo)
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
      res.status(400).json({ message: 'Nenhum arquivo enviado' });
      return;
    }

    // Verifica se todos os campos obrigatórios estão presentes
    const requiredFields = ['title', 'description', 'category', 'zone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Campos obrigatórios ausentes', { missingFields });
      
      // Remove o ficheiro se houver erro de validação
      try {
        await fs.promises.unlink(req.file.path);
        logger.info('Arquivo removido após erro de validação', {
          path: req.file.path
        });
      } catch (unlinkError) {
        logger.error('Erro ao remover arquivo', { error: unlinkError });
      }
      
      res.status(400).json({ 
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      });
      return;
    }

    logger.info('Iniciando validação pós-upload', {
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname
    });

    // Valida o vídeo (tamanho, existência)
    try {
      await validateVideo(req.file.path);
      logger.info('Validação pós-upload concluída com sucesso', {
        filename: req.file.filename
      });
      next();
    } catch (error) {
      // Remove o ficheiro se houver erro de validação
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
      
      res.status(400).json({ 
        message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
      });
      return;
    }
  } catch (error) {
    // Remove o ficheiro se houver erro inesperado
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
    
    res.status(400).json({ 
      message: error instanceof Error ? error.message : 'Erro ao validar vídeo'
    });
    return;
  }
};

// Middleware para tratamento de erros do multer (ex: ficheiro muito grande)
export const handleUploadError = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    logger.error('Erro no upload', { error: err });
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ 
        message: 'Arquivo muito grande. O tamanho máximo permitido é 10GB.' 
      });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err instanceof Error) {
    logger.error('Erro desconhecido no upload', { error: err.message, stack: err.stack });
    res.status(400).json({ message: err.message });
    return;
  }
  next(err);
};

// -----------------------------------------------------------------------------
// Este ficheiro define middlewares para upload, validação e tratamento de erros de ficheiros de vídeo na API Express.
// - upload: Middleware para upload de ficheiros usando multer.
// - uploadVideo: Middleware para upload de um único vídeo.
// - validateUploadedVideo: Middleware para validação pós-upload (campos obrigatórios, tamanho, existência).
// - handleUploadError: Middleware para tratamento de erros do multer.
// O objetivo é garantir que só vídeos válidos e com metadados completos entram no sistema, e que ficheiros inválidos são removidos imediatamente. 

interface UploadRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req: UploadRequest, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  },
}); 