import { Request, Response } from 'express';
import Accident, { IAccident } from '../models/Accident';
import logger from '../utils/logger';
import { uploadToR2, uploadFile } from '../services/storage';
import { getSignedUrl } from '../services/storage';
import { deleteFromR2, deleteFile } from '../services/storage';
import path from 'path';
import fs from 'fs/promises';

export const createAccident = async (req: Request, res: Response) => {
  try {
    logger.info('Criando novo acidente:', req.body);
    
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
    }

    // Gerar chave única para o arquivo
    const key = `accidents/${Date.now()}-${req.file.originalname}`;

    // Em desenvolvimento, salvar arquivo localmente
    if (process.env.NODE_ENV === 'development') {
      logger.info('Modo de desenvolvimento - Salvando arquivo localmente');
      const tempDir = path.join(process.cwd(), 'storage', 'temp', 'accidents');
      await fs.mkdir(tempDir, { recursive: true });
      await fs.writeFile(path.join(tempDir, path.basename(key)), req.file.buffer);
    } else {
      // Upload do arquivo para o R2 em produção
      await uploadToR2(req.file.buffer, key, req.file.mimetype);
    }

    const accidentData = {
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

    logger.info('Dados do acidente:', accidentData);
    
    const accident = new Accident(accidentData);
    const savedAccident = await accident.save();
    
    logger.info('Acidente salvo com sucesso:', {
      id: savedAccident._id
    });
    
    res.status(201).json(savedAccident);
  } catch (error: any) {
    logger.error('Erro ao criar acidente:', { 
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao criar registro de acidente',
      details: error.message
    });
  }
};

export const getAccidents = async (req: Request, res: Response) => {
  try {
    logger.info('Iniciando busca de acidentes');

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

    logger.info('Executando Accident.find() com query:', query);
    
    try {
      const accidents = await Accident.find(query).sort({ date: -1 });
      logger.info(`Encontrados ${accidents.length} acidentes`);
      
      if (accidents.length === 0) {
        return res.json([]);
      }

      // Gerar URLs assinadas para os PDFs
      const accidentsWithUrls = await Promise.all(accidents.map(async (accident) => {
        try {
          logger.info('Gerando URL assinada para documento', {
            accidentId: accident._id,
            pdfKey: accident.pdfFile?.key
          });

          if (!accident.pdfFile?.key) {
            logger.warn('Documento sem chave PDF', { accidentId: accident._id });
            return {
              ...accident.toObject(),
              pdfUrl: null
            };
          }

          const signedUrl = await getSignedUrl(accident.pdfFile.key);
          logger.info('URL assinada gerada com sucesso', {
            accidentId: accident._id,
            hasUrl: !!signedUrl
          });

          return {
            ...accident.toObject(),
            pdfUrl: signedUrl
          };
        } catch (urlError) {
          logger.error('Erro ao gerar URL para documento específico', {
            accidentId: accident._id,
            error: urlError
          });
          return {
            ...accident.toObject(),
            pdfUrl: null
          };
        }
      }));
      
      logger.info(`URLs geradas para ${accidentsWithUrls.length} documentos`);
      res.json(accidentsWithUrls);
    } catch (dbError: any) {
      logger.error('Erro na consulta do MongoDB:', { 
        error: dbError.message, 
        stack: dbError.stack,
        query 
      });
      throw dbError;
    }
  } catch (error: any) {
    logger.error('Erro no getAccidents:', { 
      error: error.message, 
      stack: error.stack 
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documentos de acidentes',
      details: error.message
    });
  }
};

export const getAccidentById = async (req: Request, res: Response) => {
  try {
    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({ error: 'Documento de acidente não encontrado' });
    }

    // Gerar URL assinada para o PDF
    const signedUrl = await getSignedUrl(accident.pdfFile.key);
    const accidentWithUrl = {
      ...accident.toObject(),
      pdfUrl: signedUrl
    };

    res.json(accidentWithUrl);
  } catch (error: any) {
    logger.error('Erro no getAccidentById:', { 
      error: error.message, 
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Erro ao buscar documento de acidente',
      details: error.message 
    });
  }
};

export const updateAccident = async (req: Request, res: Response) => {
  try {
    const { name, country, date } = req.body;
    let updateData: any = { name, country, date };

    // Se um novo arquivo foi enviado
    if (req.file) {
      const accident = await Accident.findById(req.params.id);
      if (!accident) {
        return res.status(404).json({ error: 'Documento de acidente não encontrado' });
      }

      // Deletar arquivo antigo do R2
      await deleteFromR2(accident.pdfFile.key);

      // Upload do novo arquivo
      const key = `accidents/${Date.now()}-${req.file.originalname}`;
      await uploadToR2(req.file.buffer, key, req.file.mimetype);

      updateData.pdfFile = {
        key,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    }

    const accident = await Accident.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!accident) {
      return res.status(404).json({ error: 'Documento de acidente não encontrado' });
    }

    // Gerar URL assinada para o PDF
    const signedUrl = await getSignedUrl(accident.pdfFile.key);
    const accidentWithUrl = {
      ...accident.toObject(),
      pdfUrl: signedUrl
    };

    res.json(accidentWithUrl);
  } catch (error: any) {
    logger.error('Erro no updateAccident:', {
      error: error.message,
      id: req.params.id,
      body: req.body
    });
    res.status(400).json({ 
      error: 'Erro ao atualizar registro de acidente',
      details: error.message
    });
  }
};

export const deleteAccident = async (req: Request, res: Response) => {
  try {
    const accident = await Accident.findById(req.params.id);

    if (!accident) {
      return res.status(404).json({ error: 'Documento de acidente não encontrado' });
    }

    // Deletar arquivo do R2
    await deleteFromR2(accident.pdfFile.key);

    await accident.deleteOne();
    res.status(204).send();
  } catch (error: any) {
    logger.error('Erro no deleteAccident:', {
      error: error.message,
      id: req.params.id
    });
    res.status(500).json({ 
      error: 'Erro ao deletar registro de acidente',
      details: error.message
    });
  }
}; 