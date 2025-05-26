import { Request, Response } from 'express';
import ZoneStats from '../models/ZoneStats';
import CategoryStats from '../models/CategoryStats';
import logger from '../utils/logger';

// Interface que define a estrutura das estatísticas de uma zona
export interface ZoneStatsInterface {
  zoneId: string;
  zoneName: string;
  stats: {
    videosWatched: number;
    totalVideos: number;
    completionRate: number;
    safetyScore: number;
  };
}

// Interface que define a estrutura das estatísticas de uma categoria
export interface CategoryStatsInterface {
  categoryId: string;
  title: string;
  description: string;
  videosCompleted: number;
  totalVideos: number;
  iconName: string;
}

// Função para buscar estatísticas de todas as zonas
export const getZoneStats = async (req: Request, res: Response) => {
  try {
    const statsRaw = await ZoneStats.find().lean();
    const stats: ZoneStatsInterface[] = statsRaw.map((zone: any) => ({
      zoneId: zone.zoneId,
      zoneName: zone.zoneName,
      stats: zone.stats
    }));

    const formattedStats = stats.map(zone => {
      if (zone.stats && !zone.stats.completionRate && zone.stats.totalVideos > 0) {
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

// Função para buscar estatísticas de uma zona específica
export const getZoneStatsById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const zone: any = await ZoneStats.findOne({ zoneId: id }).lean();

    if (!zone) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    if (!zone.stats.completionRate && zone.stats.totalVideos > 0) {
      zone.stats.completionRate = (zone.stats.videosWatched / zone.stats.totalVideos) * 100;
    }

    res.json(zone);
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas da zona', { error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas da zona' });
  }
};
