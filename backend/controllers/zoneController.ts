import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

// Interface que define a estrutura das estatísticas de uma zona
export interface ZoneStats {
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
export interface CategoryStats {
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
    // Obtém a coleção 'zone_stats' da base de dados
    const collection = await getCollection<ZoneStats>('zone_stats');
    // Busca todas as estatísticas das zonas
    const stats = await collection.find().toArray();
    
    // Calcula a taxa de conclusão se não estiver definida
    const formattedStats = stats.map(zone => {
      if (!zone.stats.completionRate && zone.stats.totalVideos > 0) {
        zone.stats.completionRate = (zone.stats.videosWatched / zone.stats.totalVideos) * 100;
      }
      return zone;
    });
    
    logger.info('Estatísticas de zonas recuperadas com sucesso', { count: stats.length });
    res.json(formattedStats); // Retorna as estatísticas formatadas
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas de zonas', { error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas de zonas' });
  }
};

// Função para buscar estatísticas de uma zona específica
export const getZoneStatsById = async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params; // Extrai o zoneId dos parâmetros da rota
    // Obtém a coleção 'zone_stats' da base de dados
    const collection = await getCollection<ZoneStats>('zone_stats');
    
    // Busca as estatísticas da zona pelo ID
    const zoneStats = await collection.findOne({ zoneId });
    
    if (!zoneStats) {
      logger.warn('Estatísticas da zona não encontradas', { zoneId });
      return res.status(404).json({ message: 'Estatísticas da zona não encontradas' });
    }
    
    // Calcula a taxa de conclusão se não estiver definida
    if (!zoneStats.stats.completionRate && zoneStats.stats.totalVideos > 0) {
      zoneStats.stats.completionRate = (zoneStats.stats.videosWatched / zoneStats.stats.totalVideos) * 100;
    }
    
    logger.info('Estatísticas da zona recuperadas com sucesso', { zoneId });
    res.json(zoneStats); // Retorna as estatísticas da zona
  } catch (error) {
    logger.error('Erro ao recuperar estatísticas da zona', { zoneId: req.params.zoneId, error });
    res.status(500).json({ message: 'Erro ao recuperar estatísticas da zona' });
  }
};

// Função para buscar estatísticas de todas as categorias
export const getCategoryStats = async (req: Request, res: Response) => {
  try {
    // Obtém a coleção 'category_stats' da base de dados
    const collection = await getCollection<CategoryStats>('category_stats');
    // Busca todas as estatísticas das categorias
    const stats = await collection.find().toArray();
    
    logger.info('Estatísticas de categorias recuperadas com sucesso', { count: stats.length });
    res.json(stats); // Retorna as estatísticas das categorias
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