import { Request, Response } from 'express';
import Sensibilizacao, { ISensibilizacao } from '../models/Sensibilizacao';
import logger from '../utils/logger';
import { uploadToR2, uploadFile } from '../services/storage';
import { getSignedUrl } from '../services/storage';
import { deleteFromR2, deleteFile } from '../services/storage';
import path from 'path';
import fs from 'fs/promises';
import Like from '../models/Like';
import Comment from '../models/Comment';
import mongoose from 'mongoose';

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
      return res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
    }

    // Gerar chave única para o arquivo
    const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;

    // Em desenvolvimento, salvar arquivo localmente
    if (process.env.NODE_ENV === 'development') {
      logger.info('Modo de desenvolvimento - Salvando arquivo localmente');
      const tempDir = path.join(process.cwd(), 'storage', 'temp', 'sensibilizacao');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, path.basename(key)), req.file.buffer);
    } else {
      // Upload do arquivo para o R2 em produção
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

    logger.info('Dados da sensibilização:', sensibilizacaoData);
    
    const sensibilizacao = new Sensibilizacao(sensibilizacaoData);
    const savedSensibilizacao = await sensibilizacao.save();
    
    logger.info('Documento de sensibilização salvo com sucesso:', {
      id: savedSensibilizacao._id
    });
    
    res.status(201).json(savedSensibilizacao);
  } catch (error: unknown) {
    logger.error('Erro no createSensibilizacao:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao criar documento de sensibilização',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getSensibilizacoes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    logger.info('Iniciando busca de documentos de sensibilização com agregação');

    const { country, startDate, endDate } = req.query;
    const matchQuery: AggregationMatchQuery = {};

    logger.info(`Filtros: country=${country}, startDate=${startDate}, endDate=${endDate}`);

    if (country) matchQuery.country = country as string;
    if (startDate && endDate) {
      matchQuery.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const aggregationPipeline = [
      { $match: matchQuery },
      { $sort: { date: -1 } },
      {
        $lookup: {
          from: 'likes',
          localField: '_id',
          foreignField: 'itemId',
          as: 'likesData'
        }
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'itemId',
          as: 'commentsData'
        }
      },
      {
        $addFields: {
          likeCount: { $size: '$likesData' },
          commentCount: { $size: '$commentsData' },
          userHasLiked: userId ? { 
              $in: [userId, '$likesData.userId'] 
          } : false
        }
      },
      {
        $project: {
          likesData: 0,
          commentsData: 0
        }
      }
    ];

    logger.info('Executando agregação para Sensibilizacao...');
    
    const sensibilizacoes = await Sensibilizacao.aggregate(aggregationPipeline);
    
    logger.info(`Agregação concluída, ${sensibilizacoes.length} documentos processados`);
      
    if (sensibilizacoes.length === 0) {
      return res.json([]);
    }

    const sensibilizacoesWithUrls = await Promise.all(sensibilizacoes.map(async (sensibilizacao) => {
      try {
        logger.info('Gerando URL assinada para documento', {
          sensibilizacaoId: sensibilizacao._id,
          pdfKey: sensibilizacao.pdfFile?.key
        });

        if (!sensibilizacao.pdfFile?.key) {
          logger.warn('Documento sem chave PDF', { sensibilizacaoId: sensibilizacao._id });
          return { ...sensibilizacao, pdfUrl: null } as SensibilizacaoWithUrls;
        }

        const signedUrl = await getSignedUrl(sensibilizacao.pdfFile.key);
        logger.info('URL assinada gerada com sucesso', {
          sensibilizacaoId: sensibilizacao._id,
          hasUrl: !!signedUrl
        });

        return { ...sensibilizacao, pdfUrl: signedUrl } as SensibilizacaoWithUrls;
      } catch (urlError: unknown) {
        logger.error('Erro ao gerar URL para documento específico', {
          sensibilizacaoId: sensibilizacao._id,
          error: urlError instanceof Error ? urlError.message : String(urlError)
        });
        return { ...sensibilizacao, pdfUrl: null } as SensibilizacaoWithUrls;
      }
    }));
      
    logger.info(`URLs geradas para ${sensibilizacoesWithUrls.length} documentos`);
    res.json(sensibilizacoesWithUrls);
    
  } catch (error: unknown) {
    logger.error('Erro no getSensibilizacoes:', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documentos de sensibilização',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const getSensibilizacaoById = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
       logger.warn('ID inválido fornecido para getSensibilizacaoById', { id: req.params.id });
       return res.status(400).json({ error: 'ID do documento inválido' });
    }
    const docId = new mongoose.Types.ObjectId(req.params.id);
    const userId = req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : null;
    logger.info('Buscando documento por ID com agregação', { docId, userId });

    const aggregationPipeline = [
      { $match: { _id: docId } },
      {
        $lookup: { from: 'likes', localField: '_id', foreignField: 'itemId', as: 'likesData' }
      },
      {
        $lookup: { from: 'comments', localField: '_id', foreignField: 'itemId', as: 'commentsData' }
      },
      {
        $addFields: {
          likeCount: { $size: '$likesData' },
          commentCount: { $size: '$commentsData' },
          userHasLiked: userId ? { $in: [userId, '$likesData.userId'] } : false
        }
      },
      {
        $project: { likesData: 0, commentsData: 0 }
      }
    ];

    const results = await Sensibilizacao.aggregate(aggregationPipeline);

    if (!results || results.length === 0) {
      logger.warn('Documento não encontrado após agregação', { docId });
      return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
    }

    const sensibilizacao = results[0];
    logger.info('Documento encontrado com agregação', { docId, likeCount: sensibilizacao.likeCount, commentCount: sensibilizacao.commentCount });

    try {
        if (!sensibilizacao.pdfFile?.key) {
           logger.warn('Documento sem chave PDF', { sensibilizacaoId: sensibilizacao._id });
           res.json({ ...sensibilizacao, pdfUrl: null } as SensibilizacaoWithUrls);
        } else {
          const signedUrl = await getSignedUrl(sensibilizacao.pdfFile.key);
           logger.info('URL assinada gerada com sucesso para ID específico', { sensibilizacaoId: sensibilizacao._id });
           res.json({ ...sensibilizacao, pdfUrl: signedUrl } as SensibilizacaoWithUrls);
        }   
      } catch (urlError: unknown) {
         logger.error('Erro ao gerar URL para documento específico (by ID)', { 
           sensibilizacaoId: sensibilizacao._id, 
           error: urlError instanceof Error ? urlError.message : String(urlError) 
         });
         res.json({ ...sensibilizacao, pdfUrl: null } as SensibilizacaoWithUrls);
      }

  } catch (error: unknown) {
    logger.error('Erro no getSensibilizacaoById com agregação:', { 
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documento de sensibilização',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateSensibilizacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, country, date } = req.body;
    let updateData: Record<string, unknown> = { name, country, date };

    // Se um novo arquivo foi enviado
    if (req.file) {
      const sensibilizacao = await Sensibilizacao.findById(req.params.id);
      if (!sensibilizacao) {
        return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
      }

      // Deletar arquivo antigo do R2
      await deleteFromR2(sensibilizacao.pdfFile.key);

      // Upload do novo arquivo
      const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;
      await uploadToR2(req.file.buffer, key, req.file.mimetype);

      updateData.pdfFile = {
        key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    }

    const sensibilizacao = await Sensibilizacao.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!sensibilizacao) {
      return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
    }

    // Gerar URL assinada para o PDF
    const signedUrl = await getSignedUrl(sensibilizacao.pdfFile.key);
    const sensibilizacaoWithUrl = {
      ...sensibilizacao.toObject(),
      pdfUrl: signedUrl
    } as SensibilizacaoWithUrls;

    res.json(sensibilizacaoWithUrl);
  } catch (error: unknown) {
    logger.error('Erro no updateSensibilizacao:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao atualizar documento de sensibilização',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const deleteSensibilizacao = async (req: Request, res: Response): Promise<void> => {
  try {
    const sensibilizacao = await Sensibilizacao.findById(req.params.id);

    if (!sensibilizacao) {
      return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
    }

    // Deletar arquivo do R2
    await deleteFromR2(sensibilizacao.pdfFile.key);

    await sensibilizacao.deleteOne();
    res.status(204).send();
  } catch (error: unknown) {
    logger.error('Erro no deleteSensibilizacao:', {
      error: error instanceof Error ? error.message : String(error),
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Erro ao deletar documento de sensibilização',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}; 