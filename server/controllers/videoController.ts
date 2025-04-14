import { Request, Response } from 'express';
import Video from '../models/Video';
import logger from '../utils/logger';

// Buscar todos os vídeos
export const getVideos = async (req: Request, res: Response) => {
  try {
    const videos = await Video.find();
    logger.info('Vídeos recuperados com sucesso', { count: videos.length });
    res.json(videos);
  } catch (error) {
    logger.error('Erro ao recuperar vídeos', { error });
    res.status(500).json({ message: 'Erro ao recuperar vídeos' });
  }
};

// Buscar um vídeo específico
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      logger.warn('Vídeo não encontrado', { id: req.params.id });
      return res.status(404).json({ message: 'Vídeo não encontrado' });
    }
    logger.info('Vídeo recuperado com sucesso', { id: video._id });
    res.json(video);
  } catch (error) {
    logger.error('Erro ao recuperar vídeo', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao recuperar vídeo' });
  }
};

// Criar um novo vídeo
export const createVideo = async (req: Request, res: Response) => {
  try {
    const video = new Video(req.body);
    await video.save();
    logger.info('Vídeo criado com sucesso', { id: video._id });
    res.status(201).json(video);
  } catch (error) {
    logger.error('Erro ao criar vídeo', { error });
    res.status(500).json({ message: 'Erro ao criar vídeo' });
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