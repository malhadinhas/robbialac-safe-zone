/**
 * @module server/controllers/analyticsController
 * @description Este módulo contém as funções controladoras (handlers) para rotas
 * relacionadas à obtenção de dados analíticos e estatísticas sobre o uso
 * e o estado da aplicação. Ele interage com várias coleções do MongoDB
 * para buscar e agregar dados.
 */
import { Request, Response } from 'express';
import logger from '../utils/logger'; // Utilitário de logging
import Video from '../models/Video'; // Modelo Mongoose para Vídeos
import User from '../models/User';
import Incident from '../models/Incident';
import LoginEvent from '../models/LoginEvent';
import UploadLog from '../models/UploadLog';
import { ObjectId } from 'mongodb'; // Tipo ObjectId do MongoDB

/**
 * @function getBasicAnalytics
 * @description Controladora para buscar dados analíticos básicos da aplicação.
 * Calcula contagens totais de usuários, incidentes e vídeos.
 * Inclui um exemplo de contagem de incidentes recentes.
 * @param {Request} req - Objeto da requisição Express.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um objeto JSON contendo as métricas básicas ou um erro (500).
 */
export const getBasicAnalytics = async (req: Request, res: Response): Promise<void> => {
  logger.info('Requisição recebida para obter dados analíticos básicos');
  try {
    const totalUsers = await User.countDocuments();
    const totalIncidents = await Incident.countDocuments();
    const totalVideos = await Video.countDocuments();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentIncidentsCount = await Incident.countDocuments({ date: { $gte: thirtyDaysAgo } });
    const analyticsData = {
      totalUsers,
      totalIncidents,
      totalVideos,
      recentIncidentsCount,
    };
    logger.info('Dados analíticos básicos coletados com sucesso.', analyticsData);
    res.status(200).json(analyticsData);
  } catch (error: any) {
    logger.error('Erro ao obter dados analíticos básicos:', {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Erro ao buscar dados analíticos' });
  }
};

/**
 * @function getGroupStage
 * @description Função auxiliar para criar o objeto de ID do estágio `$group`
 * da agregação do MongoDB, baseado no período de agrupamento desejado (dia, semana, mês, ano).
 * Isso permite reutilizar a lógica de agrupamento temporal em diferentes funções de estatísticas.
 * @param {string} groupBy - O período de agrupamento ('day', 'week', 'month', 'year').
 * @returns {object} Um objeto contendo a estrutura do campo `_id` para o estágio `$group`.
 */
const getGroupStage = (groupBy: string): { _id: any } => {
  // Variável para armazenar a estrutura do _id do grupo.
  let idField: any;

  // Define a estrutura do _id com base no parâmetro groupBy.
  // Utiliza operadores de data do MongoDB ($year, $month, $week, $dayOfMonth)
  // para extrair as partes relevantes do campo 'timestamp'.
  switch (groupBy) {
    case 'year':
      // Agrupa apenas por ano.
      idField = { year: { $year: "$timestamp" } };
      break;
    case 'month':
      // Agrupa por ano e mês.
      idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" } };
      break;
    case 'week':
      // Agrupa por ano e número da semana (iniciando no domingo - %U).
      idField = { year: { $year: "$timestamp" }, week: { $week: "$timestamp" } };
      break;
    case 'day': // Caso padrão é agrupar por dia.
    default:
      // Agrupa por ano, mês e dia.
      idField = { year: { $year: "$timestamp" }, month: { $month: "$timestamp" }, day: { $dayOfMonth: "$timestamp" } };
      break;
  }

  // Retorna o objeto formatado para ser usado no $group.
  // Ex: { _id: { year: 2023, month: 10, day: 26 } }
  return { _id: idField };
};

/**
 * @function getLoginStats
 * @description Controladora para obter estatísticas de eventos de login,
 * agrupadas por um período de tempo (dia, semana, mês, ano).
 * Utiliza agregação para contar o número de logins em cada período.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.groupBy`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de estatísticas de login ou um erro (500).
 */
export const getLoginStats = async (req: Request, res: Response): Promise<void> => {
  const groupBy = req.query.groupBy as string || 'day';
  logger.info(`Requisição para obter estatísticas de login`, { groupBy });
  try {
    const groupStageId = getGroupStage(groupBy);
    const stats = await LoginEvent.aggregate([
      { $group: { ...groupStageId, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
      { $project: { _id: 0, period: '$_id', count: 1 } }
    ]);
    logger.info(`Estatísticas de login por ${groupBy} coletadas com sucesso.`);
    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Erro ao obter estatísticas de login:', { error: error.message, stack: error.stack, groupBy });
    res.status(500).json({ message: 'Erro ao buscar estatísticas de login' });
  }
};

/**
 * @function getUploadStats
 * @description Controladora para obter estatísticas de uploads de arquivos,
 * como contagem de uploads e tamanho total, agrupadas por período de tempo.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.groupBy`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de estatísticas de upload ou um erro (500).
 */
export const getUploadStats = async (req: Request, res: Response): Promise<void> => {
  const groupBy = req.query.groupBy as string || 'day';
  logger.info(`Requisição para obter estatísticas de upload`, { groupBy });
  try {
    const groupStageId = getGroupStage(groupBy);
    const stats = await UploadLog.aggregate([
      { $group: { ...groupStageId, totalSize: { $sum: '$fileSize' }, count: { $sum: 1 } } },
      { $sort: { '_id': 1 } },
      { $project: { _id: 0, period: '$_id', totalSize: 1, count: 1 } }
    ]);
    logger.info(`Estatísticas de upload por ${groupBy} coletadas com sucesso.`);
    res.status(200).json(stats);
  } catch (error: any) {
    logger.error('Erro ao obter estatísticas de upload:', { error: error.message, stack: error.stack, groupBy });
    res.status(500).json({ message: 'Erro ao buscar estatísticas de upload' });
  }
};

/**
 * @function getErrorLogs
 * @description Controladora para buscar os logs de erro mais recentes armazenados no banco de dados
 * (presumivelmente pela biblioteca Winston com transporte MongoDB).
 * Implementa paginação para lidar com grandes volumes de logs.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit` e `req.query.page`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um objeto contendo os logs de erro paginados e informações de paginação, ou um erro (500).
 */
export const getErrorLogs = async (req: Request, res: Response): Promise<void> => {
  // Obtém parâmetros de paginação da query string, com padrões.
  const limit = parseInt(req.query.limit as string) || 50; // Limite de itens por página.
  const page = parseInt(req.query.page as string) || 1; // Número da página atual.
  const skip = (page - 1) * limit; // Calcula quantos documentos pular.
  logger.info(`Requisição para obter logs de erro`, { limit, page });

  try {
    // Obtém a coleção onde os logs de erro são armazenados (ex: 'errorLogs').
    // Usar 'any' como tipo genérico se não houver uma interface definida, mas o ideal seria ter uma.
    const errorLogsCollection = await getCollection<any>('errorLogs');

    // Busca os documentos de log.
    const errors = await errorLogsCollection
      .find() // Busca todos (sem filtro específico).
      .sort({ timestamp: -1 }) // Ordena pelos mais recentes primeiro (baseado no campo 'timestamp' do log).
      .skip(skip) // Pula os documentos das páginas anteriores.
      .limit(limit) // Limita o número de documentos retornados para a página atual.
      .toArray(); // Converte para array.

    // Conta o número total de documentos de erro na coleção para calcular a paginação.
    const totalErrors = await errorLogsCollection.countDocuments();
    logger.info(`Encontrados ${errors.length} logs de erro (página ${page}). Total: ${totalErrors}.`);

    // Responde com os erros encontrados e informações de paginação.
    res.status(200).json({
      errors, // Array com os documentos de erro da página atual.
      totalErrors, // Número total de erros na coleção.
      currentPage: page, // Número da página atual.
      totalPages: Math.ceil(totalErrors / limit) // Número total de páginas.
     });

  } catch (error: any) {
    // Tratamento específico para erro comum: coleção não encontrada.
    // Isso pode acontecer se o logger Winston MongoDB ainda não criou a coleção.
    if (error.message.includes('ns not found')) {
        logger.warn('Coleção errorLogs não encontrada. Verifique a configuração do logger MongoDB. Retornando array vazio.');
        // Responde com sucesso, mas com dados vazios, em vez de erro 500.
        res.status(200).json({ errors: [], totalErrors: 0, currentPage: 1, totalPages: 0 });
        return; // Para a execução.
    }
    // Captura e loga outros erros.
    logger.error('Erro ao obter logs de erro:', { error: error.message, stack: error.stack, limit, page });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro ao buscar logs de erro' });
  }
}; 