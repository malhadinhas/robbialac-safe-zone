import { Request, Response } from 'express';
import Sensibilizacao, { ISensibilizacao } from '../models/Sensibilizacao';
import logger from '../utils/logger';
import { uploadToR2, uploadFile } from '../services/storage';
import { getSignedUrl } from '../services/storage';
import { deleteFromR2, deleteFile } from '../services/storage';
import path from 'path';
import fs from 'fs/promises';

export const createSensibilizacao = async (req: Request, res: Response) => {
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
  } catch (error: any) {
    logger.error('Erro no createSensibilizacao:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao criar documento de sensibilização',
      details: error.message
    });
  }
};

export const getSensibilizacoes = async (req: Request, res: Response) => {
  try {
    logger.info('Iniciando busca de documentos de sensibilização');

    const { country, startDate, endDate } = req.query;
    const query: any = {};

    logger.info(`Filtros: country=${country}, startDate=${startDate}, endDate=${endDate}`);

    if (country) query.country = country;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    logger.info('Executando Sensibilizacao.find() com query:', query);
    
    try {
      const sensibilizacoes = await Sensibilizacao.find(query).sort({ date: -1 });
      logger.info(`Encontrados ${sensibilizacoes.length} documentos de sensibilização`);
      
      if (sensibilizacoes.length === 0) {
        return res.json([]);
      }

      // Gerar URLs assinadas para os PDFs
      const sensibilizacoesWithUrls = await Promise.all(sensibilizacoes.map(async (sensibilizacao) => {
        try {
          logger.info('Gerando URL assinada para documento', {
            sensibilizacaoId: sensibilizacao._id,
            pdfKey: sensibilizacao.pdfFile?.key
          });

          if (!sensibilizacao.pdfFile?.key) {
            logger.warn('Documento sem chave PDF', { sensibilizacaoId: sensibilizacao._id });
            return {
              ...sensibilizacao.toObject(),
              pdfUrl: null
            };
          }

          const signedUrl = await getSignedUrl(sensibilizacao.pdfFile.key);
          logger.info('URL assinada gerada com sucesso', {
            sensibilizacaoId: sensibilizacao._id,
            hasUrl: !!signedUrl
          });

          return {
            ...sensibilizacao.toObject(),
            pdfUrl: signedUrl
          };
        } catch (urlError) {
          logger.error('Erro ao gerar URL para documento específico', {
            sensibilizacaoId: sensibilizacao._id,
            error: urlError
          });
          return {
            ...sensibilizacao.toObject(),
            pdfUrl: null
          };
        }
      }));
      
      logger.info(`URLs geradas para ${sensibilizacoesWithUrls.length} documentos`);
      res.json(sensibilizacoesWithUrls);
    } catch (dbError: any) {
      logger.error('Erro na consulta do MongoDB:', { 
        error: dbError.message, 
        stack: dbError.stack,
        query 
      });
      throw dbError;
    }
  } catch (error: any) {
    logger.error('Erro no getSensibilizacoes:', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documentos de sensibilização',
      details: error.message
    });
  }
};

export const getSensibilizacaoById = async (req: Request, res: Response) => {
  try {
    const sensibilizacao = await Sensibilizacao.findById(req.params.id);

    if (!sensibilizacao) {
      return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
    }

    // Gerar URL assinada para o PDF
    const signedUrl = await getSignedUrl(sensibilizacao.pdfFile.key);
    const sensibilizacaoWithUrl = {
      ...sensibilizacao.toObject(),
      pdfUrl: signedUrl
    };

    res.json(sensibilizacaoWithUrl);
  } catch (error: any) {
    logger.error('Erro no getSensibilizacaoById:', { 
      error: error.message, 
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documento de sensibilização',
      details: error.message 
    });
  }
};

export const updateSensibilizacao = async (req: Request, res: Response) => {
  try {
    const { name, country, date } = req.body;
    let updateData: any = { name, country, date };

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
    };

    res.json(sensibilizacaoWithUrl);
  } catch (error: any) {
    logger.error('Erro no updateSensibilizacao:', {
      error: error.message,
      id: req.params.id,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao atualizar documento de sensibilização',
      details: error.message
    });
  }
};

export const deleteSensibilizacao = async (req: Request, res: Response) => {
  try {
    const sensibilizacao = await Sensibilizacao.findById(req.params.id);

    if (!sensibilizacao) {
      return res.status(404).json({ error: 'Documento de sensibilização não encontrado' });
    }

    // Deletar arquivo do R2
    await deleteFromR2(sensibilizacao.pdfFile.key);

    await sensibilizacao.deleteOne();
    res.status(204).send();
  } catch (error: any) {
    logger.error('Erro no deleteSensibilizacao:', {
      error: error.message,
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Erro ao deletar documento de sensibilização',
      details: error.message
    });
  }
}; 