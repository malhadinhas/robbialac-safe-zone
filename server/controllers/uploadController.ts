import { Request, Response } from 'express';
import { uploadToR2, getSignedUrl } from '../services/storage';
import multer from 'multer';
import path from 'path';
import logger from '../utils/logger';

const upload = multer();

export const uploadImage = [
  upload.single('image'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        logger.warn('Tentativa de upload sem arquivo');
        res.status(400).json({ error: 'Nenhuma imagem enviada.' });
        return;
      }

      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `incidents/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      
      logger.info('Iniciando upload para R2', { 
        originalName: req.file.originalname,
        key,
        mimeType: req.file.mimetype
      });

      await uploadToR2(req.file.buffer, key, req.file.mimetype);
      const url = await getSignedUrl(key);
      
      logger.info('Upload concluído com sucesso', { key });
      res.json({ url });
    } catch (error: unknown) {
      logger.error('Erro ao fazer upload da imagem:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        originalName: req.file?.originalname
      });
      res.status(500).json({ 
        error: 'Erro ao fazer upload da imagem.',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
]; 