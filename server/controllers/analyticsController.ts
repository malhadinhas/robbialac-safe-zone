import { Request, Response } from 'express';
import logger from '../utils/logger';
import { getCollection } from '../services/database'; // Importa a função para obter coleções
import Video from '../models/Video'; // Importa o modelo Video
import { User, Incident, LoginEvent, UploadLog } from '../types'; // Importa as interfaces User, Incident, LoginEvent e UploadLog
import { ObjectId } from 'mongodb';

/**
 * Obtém dados analíticos básicos da aplicação.
 */
export const getBasicAnalytics = async (req: Request, res: Response) => {
  logger.info('Requisição para obter dados analíticos básicos');
  try {
    // Obter as coleções
    const usersCollection = await getCollection<User>('users');
    const incidentsCollection = await getCollection<Incident>('incidents');
    // Para Video, usamos o modelo Mongoose diretamente se ele estiver configurado assim
    // Se Video também usar getCollection, ajuste conforme necessário

    // Contar documentos em cada coleção
    const totalUsers = await usersCollection.countDocuments();
    const totalIncidents = await incidentsCollection.countDocuments();
    const totalVideos = await Video.countDocuments(); // Usando o modelo Mongoose

    // TODO: Adicionar mais métricas (ex: incidentes por mês, vídeos por categoria)
    // Exemplo: Incidentes nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIncidentsCount = await incidentsCollection.countDocuments({
      date: { $gte: thirtyDaysAgo }
    });

    const analyticsData = {
      totalUsers,
      totalIncidents,
      totalVideos,
      recentIncidentsCount, // Adiciona nova métrica
      // Adicionar mais dados aqui
    };

    res.status(200).json(analyticsData);
  } catch (error: any) {
    logger.error('Erro ao obter dados analíticos:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Erro ao buscar dados analíticos' });
  }
};

/**
 * Define o formato do $group stage baseado no parâmetro groupBy.
 */
const getGroupStage = (groupBy: string) => {
  let format: string;
  let idField: any = { $dateToString: { date: "$timestamp" } }; // Default (embora não usado diretamente)

  switch (groupBy) {
    case 'year':
      format = "%Y";
      idField = { year: { $year: "$timestamp" } };
      break;
    case 'month':
      format = "%Y-%m"; // Ano-Mês
      idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } };
      break;
    case 'week':
      format = "%Y-%U"; // Ano-Semana (inicia Domingo)
      idField = { year: { $year: "$timestamp" }, week: { $week: "$timestamp" } };
      break;
    case 'day':
    default:
      format = "%Y-%m-%d"; // Ano-Mês-Dia
      idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" } };
      break;
  }

  // Para $group, usamos idField. Para $project, podemos usar format.
  return {
    _id: idField,
    // Usaremos format no $project se precisarmos da string formatada
  };
};

/**
 * Obtém estatísticas de eventos de login agrupados por período.
 */
export const getLoginStats = async (req: Request, res: Response) => {
  const groupBy = req.query.groupBy as string || 'day'; // day, week, month, year
  logger.info(`Requisição para obter estatísticas de login`, { groupBy });

  try {
    const loginEventsCollection = await getCollection<LoginEvent>('loginEvents');
    const groupStage = getGroupStage(groupBy);

    const stats = await loginEventsCollection.aggregate([
      {
        $group: {
          ...groupStage,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 } // Ordena por data (ano, mes, dia, etc.)
      },
      {
        $project: { // Formata a saída para ser mais legível
          _id: 0,
          period: "$_id", // Mantém o objeto _id como está
          count: 1
        }
      }
    ]).toArray();

    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Erro ao obter estatísticas de login:', { error: error.message, stack: error.stack, groupBy });
    res.status(500).json({ message: 'Erro ao buscar estatísticas de login' });
  }
};

/**
 * Obtém estatísticas de volume de upload agrupados por período.
 */
export const getUploadStats = async (req: Request, res: Response) => {
  const groupBy = req.query.groupBy as string || 'day';
  logger.info(`Requisição para obter estatísticas de upload`, { groupBy });

  try {
    const uploadLogsCollection = await getCollection<UploadLog>('uploadLogs');
    const groupStage = getGroupStage(groupBy);

    const stats = await uploadLogsCollection.aggregate([
      {
        $group: {
          ...groupStage,
          totalSize: { $sum: "$fileSize" }, // Soma o tamanho dos arquivos
          count: { $sum: 1 } // Conta o número de uploads
        }
      },
      {
        $sort: { "_id": 1 }
      },
      {
        $project: {
          _id: 0,
          period: "$_id",
          totalSize: 1,
          count: 1
        }
      }
    ]).toArray();

    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Erro ao obter estatísticas de upload:', { error: error.message, stack: error.stack, groupBy });
    res.status(500).json({ message: 'Erro ao buscar estatísticas de upload' });
  }
};

/**
 * Obtém os logs de erro mais recentes com paginação.
 */
export const getErrorLogs = async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const page = parseInt(req.query.page as string) || 1;
  const skip = (page - 1) * limit;
  logger.info(`Requisição para obter logs de erro`, { limit, page });

  try {
    const errorLogsCollection = await getCollection<any>('errorLogs'); // Usar 'any' ou definir uma interface melhor
    
    const errors = await errorLogsCollection
      .find()
      .sort({ timestamp: -1 }) // Ordena pelos mais recentes
      .skip(skip)
      .limit(limit)
      .toArray();
      
    const totalErrors = await errorLogsCollection.countDocuments();

    res.status(200).json({ 
      errors,
      totalErrors,
      currentPage: page,
      totalPages: Math.ceil(totalErrors / limit)
     });
  } catch (error: any) {
    // Verifica se o erro é por a coleção não existir (comum se o logger falhou ao criar)
    if (error.message.includes('ns not found')) {
        logger.warn('Coleção errorLogs não encontrada. Verifique a configuração do logger MongoDB.');
        return res.status(200).json({ errors: [], totalErrors: 0, currentPage: 1, totalPages: 0 }); 
    }
    logger.error('Erro ao obter logs de erro:', { error: error.message, stack: error.stack, limit, page });
    res.status(500).json({ message: 'Erro ao buscar logs de erro' });
  }
}; 