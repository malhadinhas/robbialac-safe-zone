import { Request, Response } from 'express';
import { Video } from '../models/Video';
import { logger } from '../utils/logger';

// Buscar todos os vídeos
export const getVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    logger.info(`Recuperados ${videos.length} vídeos com sucesso`);
    res.json(videos);
  } catch (error) {
    logger.error('Erro ao buscar vídeos:', { error });
    res.status(500).json({ 
      message: 'Erro ao buscar vídeos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Buscar um vídeo específico
export const getVideoById = async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      logger.warn('Tentativa de buscar vídeo sem ID');
      return res.status(400).json({ message: 'ID do vídeo é obrigatório' });
    }

    const video = await Video.findOne({ id: req.params.id });
    if (!video) {
      logger.warn(`Vídeo não encontrado com ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }

    logger.info(`Vídeo recuperado com sucesso: ${video.id}`);
    res.json(video);
  } catch (error) {
    logger.error('Erro ao buscar vídeo por ID:', { 
      error,
      videoId: req.params.id 
    });
    res.status(500).json({ 
      message: 'Erro ao buscar vídeo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Criar um novo vídeo
export const createVideo = async (req: Request, res: Response) => {
  try {
    // Verificar se já existe um vídeo com o mesmo título
    const existingVideoByTitle = await Video.findOne({ title: req.body.title });
    if (existingVideoByTitle) {
      logger.warn(`Tentativa de criar vídeo com título duplicado: ${req.body.title}`);
      return res.status(400).json({ 
        message: 'Já existe um vídeo com este título',
        existingVideo: existingVideoByTitle
      });
    }

    // Verificar se já existe um vídeo com a mesma URL
    const existingVideoByUrl = await Video.findOne({ url: req.body.url });
    if (existingVideoByUrl) {
      logger.warn(`Tentativa de criar vídeo com URL duplicada: ${req.body.url}`);
      return res.status(400).json({ 
        message: 'Já existe um vídeo com esta URL',
        existingVideo: existingVideoByUrl
      });
    }

    const video = new Video(req.body);
    await video.save();
    
    logger.info(`Novo vídeo criado: ${video.id}`, {
      title: video.title,
      category: video.category,
      zone: video.zone
    });
    
    res.status(201).json(video);
  } catch (error) {
    logger.error('Erro ao criar vídeo:', error);
    res.status(400).json({ 
      message: 'Erro ao criar vídeo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Atualizar um vídeo
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!video) {
      logger.warn(`Vídeo não encontrado para atualização: ${req.params.id}`);
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }

    logger.info(`Vídeo atualizado com sucesso: ${video.id}`);
    res.json(video);
  } catch (error) {
    logger.error('Erro ao atualizar vídeo:', {
      error,
      videoId: req.params.id
    });
    res.status(400).json({ 
      message: 'Erro ao atualizar vídeo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

// Excluir um vídeo
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const video = await Video.findOneAndDelete({ id: req.params.id });
    if (!video) {
      logger.warn(`Vídeo não encontrado para exclusão: ${req.params.id}`);
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }
    logger.info(`Vídeo excluído com sucesso: ${video.id}`);
    res.json({ message: 'Vídeo excluído com sucesso' });
  } catch (error) {
    logger.error('Erro ao excluir vídeo:', {
      error,
      videoId: req.params.id
    });
    res.status(500).json({ 
      message: 'Erro ao excluir vídeo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
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

    logger.info('Buscando vídeos por categoria:', { category, limit });

    const videos = await Video.find({ category })
      .sort({ views: -1 })
      .limit(limit)
      .lean();

    logger.info(`Encontrados ${videos.length} vídeos para a categoria "${category}"`);
    res.json(videos);
  } catch (error) {
    logger.error('Erro ao buscar vídeos por categoria:', {
      category: req.params.category,
      error: error instanceof Error ? error.stack : error
    });
    
    res.status(500).json({ 
      message: 'Erro ao buscar vídeos por categoria',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}; 