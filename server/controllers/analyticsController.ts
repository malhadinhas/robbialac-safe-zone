/**
 * @module server/controllers/analyticsController
 * @description Este módulo contém as funções controladoras (handlers) para rotas
 * relacionadas à obtenção de dados analíticos e estatísticas sobre o uso
 * e o estado da aplicação. Ele interage com várias coleções do MongoDB
 * para buscar e agregar dados.
 */
import { Request, Response } from 'express';
import logger from '../utils/logger'; // Utilitário de logging
import { getCollection } from '../services/database'; // Função para obter coleções MongoDB nativas
import Video from '../models/Video'; // Modelo Mongoose para Vídeos
import { User, Incident, LoginEvent, UploadLog } from '../types'; // Tipos/Interfaces para dados
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
    // Obtém acesso às coleções necessárias.
    // Usa getCollection para acesso direto via driver MongoDB nativo.
    const usersCollection = await getCollection<User>('users');
    const incidentsCollection = await getCollection<Incident>('incidents');
    // Para Vídeos, usa o modelo Mongoose, assumindo que ele está configurado
    // (se também usasse getCollection, o código seria similar aos outros).

    // Realiza contagens de documentos em cada coleção/modelo.
    const totalUsers = await usersCollection.countDocuments();
    const totalIncidents = await incidentsCollection.countDocuments();
    const totalVideos = await Video.countDocuments(); // Usando Mongoose

    // Exemplo de métrica adicional: Contagem de incidentes nos últimos 30 dias.
    const thirtyDaysAgo = new Date(); // Data atual
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); // Subtrai 30 dias
    // Conta documentos na coleção 'incidents' onde a data é maior ou igual a 30 dias atrás.
    const recentIncidentsCount = await incidentsCollection.countDocuments({
      date: { $gte: thirtyDaysAgo }
    });

    // Monta o objeto de resposta com os dados coletados.
    const analyticsData = {
      totalUsers,
      totalIncidents,
      totalVideos,
      recentIncidentsCount, // Inclui a contagem recente
      // Outras métricas poderiam ser adicionadas aqui.
    };

    logger.info('Dados analíticos básicos coletados com sucesso.', analyticsData);
    // Responde com os dados e status 200 OK.
    res.status(200).json(analyticsData);

  } catch (error: any) {
    // Captura e loga erros durante a busca dos dados.
    logger.error('Erro ao obter dados analíticos básicos:', {
      error: error.message,
      stack: error.stack,
    });
    // Responde com erro 500 Internal Server Error.
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
  // Obtém o parâmetro 'groupBy' da query string, com 'day' como padrão.
  const groupBy = req.query.groupBy as string || 'day';
  logger.info(`Requisição para obter estatísticas de login`, { groupBy });

  try {
    // Obtém a coleção onde os eventos de login são armazenados.
    const loginEventsCollection = await getCollection<LoginEvent>('loginEvents');
    // Obtém a estrutura de agrupamento usando a função auxiliar.
    const groupStageId = getGroupStage(groupBy);

    // Executa o pipeline de agregação.
    const stats = await loginEventsCollection.aggregate([
      // Estágio 1: Agrupar documentos pelo período de tempo definido em groupStageId.
      {
        $group: {
          ...groupStageId, // Define o _id para agrupar (ex: { year: ..., month: ... })
          count: { $sum: 1 } // Conta quantos documentos (logins) existem em cada grupo.
        }
      },
      // Estágio 2: Ordenar os resultados pelo _id (que contém a data/período) em ordem ascendente.
      {
        $sort: { "_id": 1 }
      },
      // Estágio 3: Projetar (formatar) a saída.
      {
        $project: {
          _id: 0, // Remove o campo _id original.
          period: "$_id", // Renomeia o campo _id (que contém o período) para 'period'.
          count: 1 // Mantém o campo 'count'.
        }
      }
    ]).toArray(); // Converte os resultados da agregação para um array.

    logger.info(`Estatísticas de login por ${groupBy} coletadas com sucesso.`);
    // Responde com os dados estatísticos e status 200 OK.
    res.status(200).json(stats);

  } catch (error: any) {
    // Captura e loga erros.
    logger.error('Erro ao obter estatísticas de login:', { error: error.message, stack: error.stack, groupBy });
    // Responde com erro 500 Internal Server Error.
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
  // Obtém o parâmetro 'groupBy', com 'day' como padrão.
  const groupBy = req.query.groupBy as string || 'day';
  logger.info(`Requisição para obter estatísticas de upload`, { groupBy });

  try {
    // Obtém a coleção onde os logs de upload são armazenados.
    const uploadLogsCollection = await getCollection<UploadLog>('uploadLogs');
    // Obtém a estrutura de agrupamento temporal.
    const groupStageId = getGroupStage(groupBy);

    // Executa o pipeline de agregação.
    const stats = await uploadLogsCollection.aggregate([
      // Estágio 1: Agrupar logs de upload pelo período de tempo.
      {
        $group: {
          ...groupStageId, // Define o _id para agrupar.
          totalSize: { $sum: "$fileSize" }, // Soma o tamanho ('fileSize') de todos os arquivos em cada grupo.
          count: { $sum: 1 } // Conta quantos documentos (uploads) existem em cada grupo.
        }
      },
      // Estágio 2: Ordenar os resultados pelo período em ordem ascendente.
      {
        $sort: { "_id": 1 }
      },
      // Estágio 3: Projetar (formatar) a saída.
      {
        $project: {
          _id: 0, // Remove o _id original.
          period: "$_id", // Renomeia _id para 'period'.
          totalSize: 1, // Mantém o campo 'totalSize'.
          count: 1 // Mantém o campo 'count'.
        }
      }
    ]).toArray(); // Converte para array.

    logger.info(`Estatísticas de upload por ${groupBy} coletadas com sucesso.`);
    // Responde com os dados e status 200 OK.
    res.status(200).json(stats);

  } catch (error: any) {
    // Captura e loga erros.
    logger.error('Erro ao obter estatísticas de upload:', { error: error.message, stack: error.stack, groupBy });
    // Responde com erro 500.
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