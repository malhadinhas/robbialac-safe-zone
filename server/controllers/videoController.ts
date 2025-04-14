import { Request, Response } from 'express';
import Video from '../models/Video';
import logger from '../utils/logger';
import { VideoProcessor } from '../services/videoProcessingService';
import path from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const videoProcessor = new VideoProcessor();
const TEMP_DIR = path.join(process.cwd(), 'temp');

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

    // Validar campos obrigatórios
    const requiredFields = ['title', 'description', 'category', 'zone'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      logger.warn('Campos obrigatórios ausentes', { missingFields });
      return res.status(400).json({ 
        message: `Campos obrigatórios ausentes: ${missingFields.join(', ')}` 
      });
    }

    // Verificar se já existe um vídeo com o mesmo título
    const existingVideoByTitle = await Video.findOne({ 
      title: req.body.title.trim()
    });

    if (existingVideoByTitle) {
      logger.warn('Tentativa de criar vídeo com título duplicado', {
        title: req.body.title
      });
      return res.status(400).json({ 
        message: 'Já existe um vídeo com este título' 
      });
    }

    // Verificar se já existe um vídeo com o mesmo nome de arquivo
    const existingVideoByFilename = await Video.findOne({
      url: new RegExp(req.file.filename, 'i')
    });

    if (existingVideoByFilename) {
      logger.warn('Tentativa de upload de arquivo duplicado', {
        filename: req.file.filename
      });
      return res.status(400).json({ 
        message: 'Este arquivo já foi enviado anteriormente' 
      });
    }

    // Mover o arquivo do diretório temporário para o diretório de uploads
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const finalPath = path.join(uploadDir, req.file.filename);
    await fs.promises.rename(req.file.path, finalPath);
    
    // Construir URLs
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const videoUrl = `${baseUrl}/uploads/${req.file.filename}`;
    // Por enquanto, usar uma thumbnail padrão
    const thumbnailUrl = `${baseUrl}/assets/default-thumbnail.jpg`;

    // Criar o documento do vídeo no MongoDB
    const video = new Video({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category,
      zone: req.body.zone,
      videoId: uuidv4(),
      url: videoUrl,
      thumbnail: thumbnailUrl,
      uploadDate: new Date(),
      views: 0,
      status: 'ready' // Como não temos processamento, marcar como pronto
    });

    await video.save();
    logger.info('Vídeo salvo com sucesso', { 
      id: video._id,
      title: video.title,
      category: video.category,
      zone: video.zone,
      url: video.url
    });

    res.status(201).json(video);
  } catch (error) {
    logger.error('Erro ao processar e criar vídeo', { 
      error,
      body: req.body,
      file: req.file
    });

    // Limpar arquivo em caso de erro
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
        logger.info('Arquivo temporário removido após erro', { 
          path: req.file.path 
        });
      } catch (unlinkError) {
        logger.error('Erro ao remover arquivo temporário', { 
          error: unlinkError,
          path: req.file.path
        });
      }
    }

    res.status(500).json({ 
      message: 'Erro ao processar e criar vídeo',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
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
