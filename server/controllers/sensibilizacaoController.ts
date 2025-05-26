import { Request, Response } from 'express';
import Sensibilizacao, { ISensibilizacao } from '../models/Sensibilizacao';
import logger from '../utils/logger';
import { uploadToR2, uploadFile, deleteFromR2, deleteFile, getSignedUrl } from '../services/storage';
import path from 'path';
import fs from 'fs/promises';
import Like from '../models/Like';
import Comment from '../models/Comment';
import mongoose from 'mongoose';

// Substituição do tipo personalizado ausente
interface AuthenticatedRequest extends Request {
  user?: { id: string; role: string };
}

interface SensibilizacaoWithUrls extends ISensibilizacao {
  pdfUrl: string | null;
  likeCount: number;
  commentCount: number;
  userHasLiked: boolean;
}

interface AggregationMatchQuery {
  country?: string;
  date?: {
    $gte: Date;
    $lte: Date;
  };
}

export const createSensibilizacao = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info('Criando novo documento de sensibilização:', req.body);

    if (!req.file) {
      res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
      return;
    }

    const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;

    if (process.env.NODE_ENV === 'development') {
      logger.info('Modo de desenvolvimento - Salvando arquivo localmente');
      const tempDir = path.join(process.cwd(), 'storage', 'temp', 'sensibilizacao');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, path.basename(key)), req.file.buffer);
    } else {
      await uploadToR2(req.file.buffer, key, req.file.mimetype);
    }

    const sensibilizacaoData = {
      name: req.body.name,
      country: req.body.country,
      date: new Date(req.body.date),
      pdfFile: {
        key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    };

    const sensibilizacao = new Sensibilizacao(sensibilizacaoData);
    await sensibilizacao.save();

    res.status(201).json(sensibilizacao);
  } catch (error) {
    logger.error('Erro ao criar sensibilização:', { error });
    res.status(500).json({ message: 'Erro interno ao criar documento' });
  }
};

export const getSensibilizacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const aggregationPipeline: any[] = [];

    if (req.query.country) {
      aggregationPipeline.push({
        $match: { country: req.query.country }
      });
    }

    if (req.query.startDate && req.query.endDate) {
      aggregationPipeline.push({
        $match: {
          date: {
            $gte: new Date(req.query.startDate as string),
            $lte: new Date(req.query.endDate as string)
          }
        }
      });
    }

    aggregationPipeline.push({ $sort: { date: -1 } });

    const sensibilizacoes = await Sensibilizacao.aggregate(aggregationPipeline);

    res.json(sensibilizacoes);
  } catch (error) {
    logger.error('Erro ao buscar sensibilizações:', { error });
    res.status(500).json({ message: 'Erro ao buscar documentos' });
  }
};
