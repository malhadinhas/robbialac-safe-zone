import { Request, Response } from 'express';
import ZoneStats from '../models/ZoneStats';
import CategoryStats from '../models/CategoryStats';
import logger from '../utils/logger';

// Interface que define a estrutura das estatísticas de uma zona
export interface ZoneStatsInterface {
  zoneId: string;
  zoneName: string;
  stats: {
    videosWatched: number;    // Quantidade de vídeos assistidos na zona
    totalVideos: number;      // Total de vídeos disponíveis na zona
    completionRate: number;   // Taxa de conclusão (percentagem de vídeos assistidos)
    safetyScore: number;      // Pontuação de segurança da zona
  }
}

// Interface que define a estrutura das estatísticas de uma categoria
export interface CategoryStatsInterface {
  categoryId: string;
  title: string;
  description: string;
  videosCompleted: number;    // Quantidade de vídeos concluídos na categoria
  totalVideos: number;        // Total de vídeos na categoria
  iconName: string;           // Nome do ícone associado à categoria
}

// Função para buscar estatísticas de todas as zonas
export const getZoneStats = async (req: Request, res: Response) => {
  try {
    const stats = await ZoneStats.find().lean();
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

// Função para buscar estatísticas de uma zona específica
export const getZoneStatsById = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const zoneStats = await ZoneStats.findOne({ zoneId }).lean();
    if (!zoneStats) {
      logger.warn('Estatísticas da zona não encontradas', { zoneId });
      return res.status(404).json({ message: 'Estatísticas da zona não encontradas' });
    }
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

// Função para buscar estatísticas de todas as categorias
export const getCategoryStats = async (req: Request, res: Response) => {
  try {
    const stats = await CategoryStats.find().lean();
    logger.info('Estatísticas de categorias recuperadas com sucesso', { count: stats.length });
    res.json(stats);
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas de categorias', { error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas de categorias' });
  }
};

// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de zonas e categorias para a API.
// Permite: obter estatísticas globais e detalhadas de zonas e categorias de vídeos.
// Cada função trata de um endpoint RESTful e faz logging e validação básica.
// O objetivo é centralizar toda a lógica de estatísticas de zonas e categorias neste módulo. 