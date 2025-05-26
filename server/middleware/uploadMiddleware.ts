import multer from 'multer';
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { storageConfig } from '../config/storage';

// Diretório temporário para uploads
const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const MAX_DURATION = 3600; // 1 hora em segundos

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  logger.info(`Diretório temporário criado: ${TEMP_DIR}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageConfig.tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = storageConfig.generateFileName(file.originalname);
    cb(null, uniqueId);
  }
});

const validateVideo = async (filePath: string): Promise<boolean> => {
  logger.info('Iniciando validação do vídeo', { filePath });

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      logger.error('Arquivo não encontrado', { filePath });
      reject(new Error('Arquivo não encontrado'));
      return;
    }

    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      logger.warn('Arquivo excede o tamanho máximo permitido', { size: stats.size });
      reject(new Error('Arquivo excede o tamanho máximo permitido'));
      return;
    }

    // Suporte futuro para validação de duração via ffmpeg
    resolve(true);
  });
};

// O tipo padrão de `multer.FileFilterCallback` é suficiente e compatível com Request
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/ogg', 'video/webm'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warn('Tipo de ficheiro não permitido', { mimetype: file.mimetype });
    cb(new Error('Tipo de ficheiro não permitido'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});
