import api from '@/lib/api'; // Corrigido: Importa a instância correta do Axios
import logger from '../utils/logger'; // Assume que existe um logger no frontend

/**
 * Interface para os dados analíticos básicos
 */
export interface BasicAnalyticsData {
  totalUsers: number;
  totalIncidents: number;
  totalVideos: number;
  recentIncidentsCount: number;
  // Adicionar mais campos conforme necessário
}

export interface TimeSeriesStat {
  period: string | { year?: number; month?: number; week?: number; day?: number }; // O período pode ser uma string formatada ou objeto
  count: number;
}

export interface UploadTimeSeriesStat {
  period: string | { year?: number; month?: number; week?: number; day?: number };
  totalSize: number; // Tamanho total em bytes
  count: number; // Número de uploads
}

// Interface para um único log de erro (simplificada)
export interface ErrorLog {
  _id: string;
  timestamp: string; // Ou Date
  level: string;
  message: string;
  metadata?: any; // Metadados adicionais (stack trace, etc.)
}

// Interface para a resposta da API de logs de erro (com paginação)
export interface ErrorLogResponse {
  errors: ErrorLog[];
  totalErrors: number;
  currentPage: number;
  totalPages: number;
}

type GroupByPeriod = 'day' | 'week' | 'month' | 'year';

/**
 * Busca os dados analíticos básicos da API.
 * Requer autenticação e permissão de admin_app.
 */
export const getBasicAnalytics = async (): Promise<BasicAnalyticsData> => {
  logger.info('Buscando dados analíticos básicos da API');
  try {
    const response = await api.get<BasicAnalyticsData>('/analytics/basic');
    logger.info('Dados analíticos recebidos com sucesso', { data: response.data });
    return response.data;
  } catch (error: any) {
    logger.error('Erro ao buscar dados analíticos:', {
      message: error.message,
      response: error.response?.data,
    });
    // Lança o erro para ser tratado pelo componente
    throw new Error(error.response?.data?.message || 'Falha ao buscar dados analíticos');
  }
};

/**
 * Busca estatísticas de login agrupadas por período.
 */
export const getLoginStats = async (groupBy: GroupByPeriod = 'day'): Promise<TimeSeriesStat[]> => {
  logger.info('Buscando estatísticas de login', { groupBy });
  try {
    const response = await api.get<TimeSeriesStat[]>('/analytics/logins', {
      params: { groupBy }
    });
    return response.data;
  } catch (error: any) {
    logger.error('Erro ao buscar estatísticas de login:', { error: error.message });
    throw new Error(error.response?.data?.message || 'Falha ao buscar estatísticas de login');
  }
};

/**
 * Busca estatísticas de upload agrupadas por período.
 */
export const getUploadStats = async (groupBy: GroupByPeriod = 'day'): Promise<UploadTimeSeriesStat[]> => {
  logger.info('Buscando estatísticas de upload', { groupBy });
  try {
    const response = await api.get<UploadTimeSeriesStat[]>('/analytics/uploads', {
      params: { groupBy }
    });
    return response.data;
  } catch (error: any) {
    logger.error('Erro ao buscar estatísticas de upload:', { error: error.message });
    throw new Error(error.response?.data?.message || 'Falha ao buscar estatísticas de upload');
  }
};

/**
 * Busca logs de erro paginados.
 */
export const getErrorLogs = async (page: number = 1, limit: number = 50): Promise<ErrorLogResponse> => {
  logger.info('Buscando logs de erro', { page, limit });
  try {
    const response = await api.get<ErrorLogResponse>('/analytics/errors', {
      params: { page, limit }
    });
    return response.data;
  } catch (error: any) {
    logger.error('Erro ao buscar logs de erro:', { error: error.message });
    throw new Error(error.response?.data?.message || 'Falha ao buscar logs de erro');
  }
}; 