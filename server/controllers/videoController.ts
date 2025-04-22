import { Request, Response } from 'express';
import Video from '../models/Video';
import logger from '../utils/logger';
import { VideoProcessor } from '../services/videoProcessingService';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId } from 'mongoose';
import { getCollection } from '../services/database';
import { UploadLog } from '../types';

const videoProcessor = new VideoProcessor();
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Buscar todos os vídeos
export const getVideos = async (req: Request, res: Response) => {
  try {
    // Busca os vídeos diretamente como objetos JS planos
    const videosFromDb = await Video.find().lean(); 
    logger.info(`Vídeos recuperados do DB para GET /api/videos: ${videosFromDb.length}`);

    // Retorna os dados como estão (com as chaves R2, não URLs assinadas)
    // ** LOG ANTES DE ENVIAR RESPOSTA **
    logger.info('Dados dos vídeos a serem enviados na resposta GET /api/videos:', videosFromDb);
    res.json(videosFromDb); 

  } catch (error) {
    logger.error('Erro ao recuperar vídeos em GET /api/videos', { error: getErrorMessage(error) });
    res.status(500).json({ message: 'Erro ao recuperar vídeos' });
  }
};

// Buscar um vídeo específico
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      logger.warn('Tentativa de acesso GET /api/videos/:id com ID inválido', { id });
      return res.status(400).json({ message: 'ID de vídeo inválido' });
    }
    
    // Busca o vídeo como objeto JS plano
    const video = await Video.findById(id).lean(); 
    
    if (!video) {
      logger.warn('Vídeo não encontrado em GET /api/videos/:id', { id });
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }
    
    // Não incrementa mais visualizações aqui, deve ser feito no frontend se necessário após carregar
    /* 
    if (req.query.view === 'true' && video.status === 'ready') {
      // A lógica de incremento precisa ser reavaliada, 
      // pois lean() retorna objeto plano, não documento Mongoose
      // Poderia fazer um findByIdAndUpdate separado se necessário.
      // await Video.findByIdAndUpdate(id, { $inc: { views: 1 } });
      // logger.info('Visualização incrementada', { id });
    }
    */
    
    // Retorna o vídeo como está (com as chaves R2, sem URLs assinadas)
    logger.info(`Vídeo encontrado em GET /api/videos/:id : ${id}`, { videoStatus: video.status });
    // ** LOG ANTES DE ENVIAR RESPOSTA **
    logger.info(`Dados do vídeo a serem enviados na resposta GET /api/videos/${id}:`, video);
    res.json(video); 

  } catch (error) {
    logger.error('Erro ao obter vídeo por ID em GET /api/videos/:id', { error: getErrorMessage(error), id: req.params.id });
    res.status(500).json({ message: 'Erro interno ao obter vídeo', error: getErrorMessage(error) });
  }
};

// Função auxiliar para obter mensagem de erro
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Criar um novo vídeo
export const createVideo = async (req: Request, res: Response) => {
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
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    originalFilePath = req.file.path;
    uploadedFileSize = req.file.size;
    uploadedMimeType = req.file.mimetype;

    // Validar campos obrigatórios
    const requiredFields = ['title', 'description', 'category', 'zone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Campos obrigatórios ausentes', { missingFields });
      return res.status(400).json({ 
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      });
    }

    try {
      // Validar o vídeo
      const videoProcessor = new VideoProcessor();
      const videoInfo = await videoProcessor.validateVideo(req.file.path);
      
      if (!videoInfo) {
        logger.error('Erro na validação do vídeo');
        return res.status(400).json({ message: 'Erro na validação do vídeo' });
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
      videoId = video._id;
      
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
              const uploadLogsCollection = await getCollection<UploadLog>('uploadLogs');
              const newUploadLog: Omit<UploadLog, '_id'> = {
                userId: req.user?.id,
                fileName: req.file?.originalname || 'desconhecido',
                fileSize: uploadedFileSize,
                mimeType: uploadedMimeType || 'desconhecido',
                storageType: 'r2',
                fileKey: updateResult.r2VideoKey,
                timestamp: new Date()
              };
              await uploadLogsCollection.insertOne(newUploadLog as UploadLog);
              logger.info('Evento de upload registado com sucesso', { videoId: videoId!.toString(), fileKey: newUploadLog.fileKey });
            } catch (logError: any) {
              logger.error('Falha ao registar evento de upload', { videoId: videoId!.toString(), error: logError.message });
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

    } catch (validationError) {
      logger.error('Erro na validação ou criação do vídeo', { validationError });
      
      // Limpar arquivo temporário
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
          logger.info('Arquivo temporário removido após erro de validação', { 
            path: req.file.path 
          });
        } catch (cleanupError) {
          logger.error('Erro ao remover arquivo temporário', { 
            error: cleanupError,
            path: req.file.path
          });
        }
      }
      
      return res.status(400).json({ 
        message: validationError instanceof Error ? validationError.message : 'Erro na validação ou criação do vídeo' 
      });
    }
  } catch (error) {
    logger.error('Erro GERAL ao criar vídeo', { error: error.message, stack: error.stack });
    
    // Limpar arquivo temporário original em caso de erro inicial
    if (originalFilePath) {
      try {
        await fs.unlink(originalFilePath);
        logger.info('Arquivo temporário original removido após erro inicial', { path: originalFilePath });
      } catch (cleanupError) {
        logger.error('Erro ao remover arquivo temporário original após erro inicial', { error: cleanupError });
      }
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Erro de validação',
        errors: error.errors 
      });
    }

    res.status(500).json({ 
      message: 'Erro ao criar vídeo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Atualizar um vídeo
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!video) {
      logger.warn('Vídeo não encontrado para atualização', { id: req.params.id });
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }
    logger.info('Vídeo atualizado com sucesso', { id: video._id });
    res.json(video);
  } catch (error) {
    logger.error('Erro ao atualizar vídeo', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao atualizar vídeo' });
  }
};

// Excluir um vídeo
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findByIdAndDelete(req.params.id);
    if (!video) {
      logger.warn('Vídeo não encontrado para exclusão', { id: req.params.id });
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }
    logger.info('Vídeo excluído com sucesso', { id: req.params.id });
    res.json({ message: 'Vídeo excluído com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir vídeo', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao excluir vídeo' });
  }
};

// Incrementar visualizações
export const incrementVideoViews = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      logger.warn('Tentativa de incrementar visualizações sem ID do vídeo');
      return res.status(400).json({ message: 'ID do vídeo é obrigatório' });
    }

    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      logger.warn(`Vídeo não encontrado para incremento de views: ${req.params.id}`);
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }

    logger.info(`Visualizações incrementadas com sucesso para o vídeo: ${video.id}`);
    res.json(video);
  } catch (error) {
    logger.error('Erro ao incrementar visualizações:', { 
      error,
      videoId: req.params.id 
    });
    res.status(500).json({ 
      message: 'Erro ao incrementar visualizações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Buscar vídeos mais visualizados por categoria
export const getLastViewedVideosByCategory = async (req: Request, res: Response) => {
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
      error,
      category,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    res.status(500).json({ 
      message: 'Erro ao buscar vídeos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Função para buscar vídeos recentes
export async function getRecentVideos(req: Request, res: Response) {
    logger.info('Attempting to fetch recent videos...'); // Log inicial
    try {
        const limit = parseInt(req.query.limit as string) || 5;
        logger.info(`Parsed limit: ${limit}`); // Log do limite

        if (limit <= 0) {
            logger.warn('Invalid limit requested for recent videos', { limit });
            return res.status(400).json({ error: 'O limite deve ser um número positivo.' });
        }

        logger.info(`Querying database for ${limit} recent videos...`);
        const recentVideos = await Video.find({ status: 'ready' }) // Buscar apenas vídeos prontos?
            .sort({ createdAt: -1 }) // Ordena por data de criação, mais recente primeiro
            .limit(limit)
            .select('_id title createdAt') // Selecionar apenas campos necessários
            .exec();
        
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
        res.status(500).json({ 
            error: 'Erro ao buscar vídeos recentes',
            details: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
    }
}
