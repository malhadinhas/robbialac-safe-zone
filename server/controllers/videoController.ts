import { Request, Response } from 'express';
import Video from '../models/Video';
import logger from '../utils/logger';
import { VideoProcessor } from '../services/videoProcessingService';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId } from 'mongoose';
import { UploadLog } from '../types';
import UploadLogModel from '../models/UploadLog';

interface VideoResponse {
  _id: string;
  title: string;
  description: string;
  category: string;
  zone: string;
  duration: number;
  r2VideoKey: string;
  r2ThumbnailKey: string;
  views: number;
  uploadDate: Date;
  r2Qualities: {
    high: string;
    medium: string;
    low: string;
  };
  status: 'processing' | 'ready' | 'error';
  processingError?: string;
}

const videoProcessor = new VideoProcessor();
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Buscar todos os vídeos
export async function getVideos(req: Request, res: Response): Promise<void> {
  try {
    const videosFromDb = await Video.find().lean(); 
    logger.info(`Vídeos recuperados do DB para GET /api/videos: ${videosFromDb.length}`);
    res.json(videosFromDb);
    logger.info('Dados dos vídeos a serem enviados na resposta GET /api/videos:', videosFromDb);
  } catch (error: unknown) {
    logger.error('Erro ao recuperar vídeos em GET /api/videos', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ message: 'Erro ao recuperar vídeos' });
  }
}

// Buscar um vídeo específico
export async function getVideoById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      logger.warn('Tentativa de acesso GET /api/videos/:id com ID inválido', { id });
      res.status(400).json({ message: 'ID de vídeo inválido' });
      return;
    }
    
    // Busca o vídeo como objeto JS plano
    const video = await Video.findById(id).lean(); 
    
    if (!video) {
      logger.warn('Vídeo não encontrado em GET /api/videos/:id', { id });
      res.status(404).json({ message: 'Vídeo não encontrado' });
      return;
    }
    
    logger.info(`Vídeo encontrado em GET /api/videos/:id : ${id}`, { videoStatus: video.status });
    logger.info(`Dados do vídeo a serem enviados na resposta GET /api/videos/${id}:`, video);
  } catch (error: unknown) {
    logger.error('Erro ao obter vídeo por ID em GET /api/videos/:id', { 
      error: error instanceof Error ? error.message : String(error), 
      id: req.params.id,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ message: 'Erro ao obter vídeo por ID' });
  }
}

// Função auxiliar para obter mensagem de erro
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Criar um novo vídeo
export async function createVideo(req: Request, res: Response): Promise<void> {
  let videoId: string | null = null;
  let originalFilePath: string | null = null;
  let uploadedFileSize: number | null = null;
  let uploadedMimeType: string | null = null;
  
  try {
    logger.info('Iniciando criação de vídeo', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null
    });

    if (!req.file) {
      logger.error('Nenhum arquivo enviado');
      return;
    }

    originalFilePath = req.file.path;
    uploadedFileSize = req.file.size;
    uploadedMimeType = req.file.mimetype;

    // Validar campos obrigatórios
    const requiredFields = ['title', 'description', 'category', 'zone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Campos obrigatórios ausentes', { missingFields });
      return;
    }

    try {
      // Validar o vídeo
      const videoProcessor = new VideoProcessor();
      const videoInfo = await videoProcessor.validateVideo(req.file.path);
      
      if (!videoInfo) {
        logger.error('Erro na validação do vídeo');
        return;
      }

      // Gerar um videoId único usando UUID
      const uniqueVideoId = uuidv4();
      
      // Validar categoria
      const validCategories = ['Segurança', 'Qualidade', 'Procedimentos e Regras', 'Treinamento', 'Equipamentos', 'Outros', 'Procedimentos'];
      let category = req.body.category;
      
      if (!validCategories.includes(category)) {
        // Normalizar a categoria
        if (category.toLowerCase().includes('seguranca') || category.toLowerCase().includes('segurança')) {
          category = 'Segurança';
        } else if (category.toLowerCase().includes('treinamento')) {
          category = 'Treinamento';
        } else if (category.toLowerCase().includes('procedimento')) {
          category = 'Procedimentos';
        } else {
          category = 'Outros';
        }
      }
      
      // Definir chaves R2 temporárias/placeholders
      const temporaryR2VideoKey = `temp/${req.file.filename}`; // Chave temporária para o vídeo original
      const temporaryR2ThumbnailKey = 'placeholders/thumbnail.jpg'; // Chave placeholder para thumbnail

      // Criar objeto do vídeo inicial com valores temporários para os campos obrigatórios
      const video = new Video({
        videoId: uniqueVideoId,
        title: req.body.title.trim(),
        description: req.body.description.trim(),
        category: category,
        zone: req.body.zone,
        duration: videoInfo.duration || 0,
        r2VideoKey: temporaryR2VideoKey, // Usar chave temporária
        r2ThumbnailKey: temporaryR2ThumbnailKey, // Usar chave placeholder
        views: 0,
        uploadDate: new Date(),
        r2Qualities: { // Usar chaves temporárias/placeholders
          high: temporaryR2VideoKey,
          medium: temporaryR2VideoKey,
          low: temporaryR2VideoKey
        },
        status: 'processing'
      });

      // Salvar para obter o ID
      await video.save();
      videoId = video._id?.toString() ?? null;
      
      logger.info('Vídeo criado com sucesso, iniciando processamento', { 
        id: videoId,
        videoId: uniqueVideoId,
        title: video.title
      });

      // Retornar resposta imediata ANTES do processamento
      res.status(202).json({
        message: 'Vídeo recebido e em processamento',
        videoId: video._id,
        uniqueId: video.videoId,
        status: 'processing'
      });

      // Iniciar processamento em background
      process.nextTick(async () => {
        try {
          // Gerar thumbnail e obter a chave R2
          const thumbnailR2Key = await videoProcessor.generateThumbnail(originalFilePath!, videoId!.toString());
          
          // Processar vídeo em diferentes qualidades e obter as chaves R2
          const processedR2Keys = await videoProcessor.processVideo(originalFilePath!, videoId!.toString());

          // ** LOG DETALHADO ANTES DO UPDATE **
          logger.info('Valores para atualizar no MongoDB', {
            videoIdToUpdate: videoId?.toString(),
            updateData: {
              r2VideoKey: processedR2Keys?.high,
              r2ThumbnailKey: thumbnailR2Key,
              r2Qualities: processedR2Keys,
              status: 'ready'
            }
          });

          // Verificar se as chaves são válidas
          if (!videoId || !thumbnailR2Key || !processedR2Keys?.high) {
             logger.error('ERRO CRÍTICO: ID do vídeo ou chaves R2 em falta antes de atualizar o MongoDB!', {
               videoIdExists: !!videoId,
               thumbnailKeyExists: !!thumbnailR2Key,
               highQualityKeyExists: !!processedR2Keys?.high
             });
             // Atualizar status para erro se chaves críticas faltarem
             await Video.findByIdAndUpdate(videoId, { 
               status: 'error',
               processingError: 'Falha ao obter chaves R2 necessárias após processamento.'
             });
             return; // Não continuar com a atualização normal
          }

          // Atualizar vídeo com as chaves R2 e status
          const updateResult = await Video.findByIdAndUpdate(videoId!, {
            r2VideoKey: processedR2Keys.high,
            r2ThumbnailKey: thumbnailR2Key,
            r2Qualities: { 
              high: processedR2Keys.high,
              medium: processedR2Keys.medium,
              low: processedR2Keys.low
            },
            status: 'ready'
          }, { new: true });

          // ** LOG DO RESULTADO DO UPDATE **
          logger.info('Resultado da operação findByIdAndUpdate', {
             videoIdUpdated: videoId?.toString(),
             updateResult // Logar o documento retornado (ou null se não encontrado/falhou)
          });

          // Verificar se o resultado contém as chaves (redundante se {new: true} funcionar)
          if (!updateResult || !updateResult.r2ThumbnailKey || !updateResult.r2VideoKey) {
            logger.error('ERRO PÓS-UPDATE: Documento atualizado não contém as chaves R2 esperadas!', {
              updateResult // Logar o que foi retornado
            });
          }

          // <<< INÍCIO: Registar Upload Log >>>
          if (updateResult && updateResult.status === 'ready' && uploadedFileSize) {
            try {
              const newUploadLog = await UploadLogModel.create({
                userId: req.user?.id,
                fileName: req.file?.originalname || 'desconhecido',
                fileSize: uploadedFileSize,
                mimeType: uploadedMimeType || 'desconhecido',
                storageType: 'r2',
                fileKey: updateResult.r2VideoKey,
                timestamp: new Date()
              });
              logger.info('Evento de upload registado com sucesso', { videoId: videoId!.toString(), fileKey: newUploadLog.fileKey });
            } catch (logError: unknown) {
              logger.error('Falha ao registar evento de upload', { videoId: videoId!.toString(), error: logError instanceof Error ? logError.message : String(logError) });
            }
          }
          // <<< FIM: Registar Upload Log >>>

          logger.info('Processamento do vídeo concluído e chaves R2 atualizadas', { 
            id: videoId,
            title: video.title,
            keys: {
              thumbnail: thumbnailR2Key,
              high: processedR2Keys.high,
              medium: processedR2Keys.medium,
              low: processedR2Keys.low
            }
          });

          // Limpar arquivo temporário original APÓS sucesso
          if (originalFilePath) {
            try {
              await fs.unlink(originalFilePath);
              logger.info('Arquivo temporário original removido após sucesso', { path: originalFilePath });
            } catch (cleanupError) {
              logger.error('Erro ao remover arquivo temporário original após sucesso', { error: cleanupError });
            }
          }

        } catch (error) {
          logger.error('Erro no processamento do vídeo', { 
            error, 
            videoId 
          });

          // Atualizar status para erro
          if (videoId) {
            await Video.findByIdAndUpdate(videoId, {
              status: 'error',
              processingError: error instanceof Error ? error.message : 'Erro desconhecido'
            });
          }

          // Limpar arquivo temporário original em caso de erro no processamento
          if (originalFilePath) {
            try {
              await fs.unlink(originalFilePath);
              logger.info('Arquivo temporário original removido após erro no processamento', { path: originalFilePath });
            } catch (cleanupError) {
              logger.error('Erro ao remover arquivo temporário original após erro no processamento', { error: cleanupError });
            }
          }
        }
      });

    } catch (validationError: unknown) {
      logger.error('Erro na validação ou criação do vídeo', { validationError: validationError instanceof Error ? validationError.message : String(validationError) });
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
          logger.info('Arquivo temporário removido após erro de validação', { path: req.file.path });
        } catch (cleanupError) {
          logger.error('Erro ao remover arquivo temporário', { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError), path: req.file.path });
        }
      }
      return;
    }
  } catch (error: unknown) {
    logger.error('Erro GERAL ao criar vídeo', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    if (originalFilePath) {
      try {
        await fs.unlink(originalFilePath);
        logger.info('Arquivo temporário original removido após erro inicial', { path: originalFilePath });
      } catch (cleanupError) {
        logger.error('Erro ao remover arquivo temporário original após erro inicial', { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
      }
    }
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ message: 'Erro de validação ao criar vídeo' });
      return;
    }
    res.status(500).json({ message: 'Erro ao criar vídeo' });
  }
}

// Atualizar um vídeo
export async function updateVideo(req: Request, res: Response): Promise<void> {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) {
      logger.warn('Vídeo não encontrado para atualização', { id: req.params.id });
      res.status(404).json({ message: 'Vídeo não encontrado para atualização' });
      return;
    }
    logger.info('Vídeo atualizado com sucesso', { id: video._id });
    res.json(video);
  } catch (error) {
    logger.error('Erro ao atualizar vídeo', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao atualizar vídeo' });
  }
}

// Excluir um vídeo
export async function deleteVideo(req: Request, res: Response): Promise<void> {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      logger.warn('Vídeo não encontrado para exclusão', { id: req.params.id });
      res.status(404).json({ message: 'Vídeo não encontrado para exclusão' });
      return;
    }
    logger.info('Vídeo excluído com sucesso', { id: req.params.id });
  } catch (error) {
    logger.error('Erro ao excluir vídeo', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao excluir vídeo' });
  }
}

// Incrementar visualizações
export async function incrementVideoViews(req: Request, res: Response): Promise<void> {
  try {
    if (!req.params.id) {
      logger.warn('Tentativa de incrementar visualizações sem ID do vídeo');
      res.status(400).json({ message: 'ID do vídeo é obrigatório' });
      return;
    }
    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!video) {
      logger.warn(`Vídeo não encontrado para incremento de views: ${req.params.id}`);
      res.status(404).json({ message: 'Vídeo não encontrado para incremento de views' });
      return;
    }
    logger.info(`Visualizações incrementadas com sucesso para o vídeo: ${video.id}`);
    res.json(video);
  } catch (error) {
    logger.error('Erro ao incrementar visualizações:', { 
      error,
      videoId: req.params.id 
    });
    res.status(500).json({ message: 'Erro ao incrementar visualizações' });
  }
}

// Buscar vídeos mais visualizados por categoria
export async function getLastViewedVideosByCategory(req: Request, res: Response): Promise<void> {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info('Buscando vídeos por categoria', { category, limit });

    const videos = await Video.find({ category })
      .sort({ views: -1 })
      .limit(limit)
      .lean();

    logger.info('Vídeos recuperados com sucesso', { 
      category,
      count: videos.length 
    });

    res.json(videos);
  } catch (error) {
    logger.error('Erro ao buscar vídeos por categoria', { 
      error: error instanceof Error ? error.message : String(error),
      category: req.params.category,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Função para buscar vídeos recentes
export async function getRecentVideos(req: Request, res: Response): Promise<void> {
    logger.info('Attempting to fetch recent videos...'); // Log inicial
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        logger.info(`Parsed limit: ${limit}`); // Log do limite

        if (limit <= 0) {
            logger.warn('Invalid limit requested for recent videos', { limit });
            res.status(400).json({ message: 'O limite deve ser um número positivo.' });
            return;
        }

        logger.info(`Querying database for ${limit} recent videos...`);
        const recentVideos = await Video.find({ status: 'ready' }) // Buscar apenas vídeos prontos?
            .sort({ createdAt: -1 }) // Ordena por data de criação, mais recente primeiro
            .limit(limit)
            .select('_id title createdAt') // Selecionar apenas campos necessários
            .lean();
        
        logger.info(`Found ${recentVideos.length} recent videos.`);

        // Não precisamos mapear aqui se select já fez o trabalho
        // const formattedVideos = recentVideos.map(vid => ({
        //   _id: vid._id,
        //   title: vid.title,
        //   createdAt: vid.createdAt.toISOString(),
        // }));

        res.json(recentVideos); // Retorna os vídeos diretamente

    } catch (error) {
        logger.error('Error fetching recent videos:', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            query: req.query
        });
        res.status(500).json({ message: 'Erro ao buscar vídeos recentes' });
    }
}
