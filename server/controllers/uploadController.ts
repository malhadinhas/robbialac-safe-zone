import { Request, Response } from 'express';
import { uploadToR2, getSignedUrl } from '../services/storage';
import multer from 'multer';
import path from 'path';

const upload = multer();

export const uploadImage = [
  upload.single('image'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
      }
      const ext = path.extname(req.file.originalname) || '.jpg';
      const key = `incidents/${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
      await uploadToR2(req.file.buffer, key, req.file.mimetype);
      const url = await getSignedUrl(key);
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao fazer upload da imagem.' });
    }
  }
]; 