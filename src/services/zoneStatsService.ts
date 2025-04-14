import api from '@/lib/api';

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

/**
 * Busca estatísticas de todas as zonas
 * @returns Estatísticas por zona
 */
export async function getZoneStats(): Promise<ZoneStats[]> {
  try {
    const response = await api.get('/zones/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas das zonas:', error);
    // Retorna uma lista vazia em caso de erro
    return [];
  }
}

/**
 * Busca estatísticas de uma zona específica
 * @param zoneId ID da zona
 * @returns Estatísticas da zona ou null se não encontrada
 */
export async function getZoneStatsById(zoneId: string): Promise<ZoneStats | null> {
  try {
    const response = await api.get(`/zones/${zoneId}/stats`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    
    console.error(`Erro ao buscar estatísticas da zona ${zoneId}:`, error);
    return null;
  }
}

/**
 * Busca estatísticas de todas as categorias de treinamento
 * @returns Estatísticas por categoria
 */
export async function getCategoryStats(): Promise<CategoryStats[]> {
  try {
    const response = await api.get('/zones/categories/stats');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas das categorias:', error);
    // Retorna uma lista vazia em caso de erro
    return [];
  }
} 