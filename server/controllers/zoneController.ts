import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

export interface ZoneStats {
  zoneId: string;
  zoneName: string;
  stats: {
    videosWatched: number;
    totalVideos: number;
    completionRate: number;
    safetyScore: number;
  }
}

export interface CategoryStats {
  categoryId: string;
  title: string;
  description: string;
  videosCompleted: number;
  totalVideos: number;
  iconName: string;
}

// Buscar estatísticas de todas as zonas
export const getZoneStats = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<ZoneStats>('zone_stats');
    const stats = await collection.find().toArray();
    
    // Calcular taxa de conclusão se não estiver definida
    const formattedStats = stats.map(zone => {
      if (!zone.stats.completionRate && zone.stats.totalVideos > 0) {
        zone.stats.completionRate = (zone.stats.videosWatched / zone.stats.totalVideos) * 100;
      }
      return zone;
    });
    
    logger.info('Estatísticas de zonas recuperadas com sucesso', { count: stats.length });
    res.json(formattedStats);
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas de zonas', { error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas de zonas' });
  }
};

// Buscar estatísticas de uma zona específica
export const getZoneStatsById = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const collection = await getCollection<ZoneStats>('zone_stats');
    
    const zoneStats = await collection.findOne({ zoneId });
    
    if (!zoneStats) {
      logger.warn('Estatísticas da zona não encontradas', { zoneId });
      return res.status(404).json({ message: 'Estatísticas da zona não encontradas' });
    }
    
    // Calcular taxa de conclusão se não estiver definida
    if (!zoneStats.stats.completionRate && zoneStats.stats.totalVideos > 0) {
      zoneStats.stats.completionRate = (zoneStats.stats.videosWatched / zoneStats.stats.totalVideos) * 100;
    }
    
    logger.info('Estatísticas da zona recuperadas com sucesso', { zoneId });
    res.json(zoneStats);
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas da zona', { zoneId: req.params.zoneId, error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas da zona' });
  }
};

// Buscar estatísticas de categorias
export const getCategoryStats = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<CategoryStats>('category_stats');
    const stats = await collection.find().toArray();
    
    logger.info('Estatísticas de categorias recuperadas com sucesso', { count: stats.length });
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas de categorias', { error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas de categorias' });
  }
}; 