/**
 * @module server/controllers/activityController
 * @description Este módulo contém as funções controladoras para registrar e buscar
 * atividades dos usuários, como visualização de vídeos, reporte de incidentes,
 * conclusão de treinamentos e conquista de medalhas. Também inclui uma função
 * para gerar um feed de atividades recentes unificado (combinando Quase Acidentes,
 * Acidentes e Sensibilizações) com contagem de interações (likes/comentários).
 */
import { Request, Response } from 'express';
import UserActivity from '../models/UserActivity';
import logger from '../utils/logger'; // Utilitário de logging
import { ObjectId } from 'mongodb'; // Tipo ObjectId do MongoDB
import { checkActionBasedMedals } from './medalController'; // Função para verificar conquistas de medalhas baseadas em ações
// Importa modelos Mongoose para buscar documentos no getFeed
import Accident, { IAccident } from '../models/Accident';
import Sensibilizacao, { ISensibilizacao } from '../models/Sensibilizacao';
// Importa tipo Incident (provavelmente de um arquivo types.ts)
import { Incident } from '../types';
// Importa modelos Like e Comment para usar na agregação do getFeed
import Like from '../models/Like';
import Comment from '../models/Comment';
import mongoose from 'mongoose'; // Importa mongoose para usar ObjectId
import User from '../models/User'; // Importa o modelo User

/**
 * @interface FeedItem
 * @description Define a estrutura de um item no feed de atividades unificado.
 * Inclui tipo (QA ou Documento), título, data e contagens opcionais de likes/comentários.
 */
interface FeedItem {
  _id: string; // ID do item (QA, Acidente, Sensibilização) como string
  type: 'qa' | 'document' | 'activity'; // Tipo do item: 'qa' para Quase Acidente, 'document' para Acidente/Sensibilização, 'activity' para atividade de like/comentário
  title: string; // Título ou nome do item
  date: string; // Data do item em formato string ISO 8601
  documentType?: 'Acidente' | 'Sensibilizacao'; // Subtipo, se for um documento
  likeCount?: number; // Contagem de Likes (opcional)
  commentCount?: number; // Contagem de Comentários (opcional)
  action?: 'like' | 'comment'; // Ação associada à atividade (opcional)
  userName?: string; // Nome do usuário associado à atividade (opcional)
  commentText?: string; // Texto do comentário associado à atividade (opcional)
}

/**
 * @interface UserActivity
 * @description Define a estrutura de um documento na coleção 'user_activities'.
 * Representa uma ação realizada por um usuário na plataforma.
 */
interface UserActivity {
  _id?: ObjectId; // ID do documento da atividade (opcional, gerado pelo MongoDB)
  userId: string; // ID do usuário que realizou a atividade
  category: 'video' | 'incident' | 'training' | 'medal'; // Categoria da atividade
  activityId: string; // ID do item específico relacionado à atividade (ID do vídeo, incidente, etc.)
  points: number; // Pontos ganhos por esta atividade
  timestamp: Date; // Data e hora em que a atividade ocorreu
  details?: Record<string, unknown>; // Campo opcional para armazenar detalhes extras sobre a atividade
}

/**
 * @interface FormattedActivity
 * @description Define a estrutura de uma atividade formatada para ser enviada ao frontend.
 * Inclui uma descrição gerada e formata o ID e a data.
 */
interface FormattedActivity {
  id: string; // ID da atividade como string
  userId: string; // ID do usuário
  category: string; // Categoria da atividade
  activityId: string; // ID do item relacionado
  description: string; // Descrição textual gerada para a atividade
  points: number; // Pontos ganhos
  date: string; // Data da atividade em formato string ISO 8601
  details?: Record<string, unknown>; // Detalhes extras
}

/**
 * @function registerActivityData
 * @description Função utilitária para registar atividade a partir de dados (uso interno)
 * @param {Object} params - Objeto com os dados da atividade
 * @returns {Promise<void>} - Retorna uma Promise que resolve quando a atividade é registrada com sucesso
 */
export async function registerActivityData({ userId, category, activityId, points, details }: { userId: string, category: 'video' | 'incident' | 'training' | 'medal', activityId: string, points: number, details?: Record<string, unknown> }) {
  // Validação 1: Verifica se os campos obrigatórios foram fornecidos.
  if (!userId || !category || !activityId || points === undefined) {
    logger.warn('Tentativa de registrar atividade com dados incompletos', { userId, category, activityId, points });
    throw new Error('Dados incompletos para registro de atividade');
  }
  const validCategories = ['video', 'incident', 'training', 'medal'];
  if (!validCategories.includes(category)) {
    logger.warn(`Categoria inválida recebida: ${category}`, { userId, activityId });
    throw new Error('Categoria inválida');
  }
  const activity: UserActivity = {
    userId,
    category,
    activityId,
    points: Number(points),
    timestamp: new Date(),
    details
  };
  await UserActivity.create(activity);
  // Atualizar pontos do utilizador
  const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
  const userQuery = userObjectId ? { _id: userObjectId } : { id: userId };
  await User.updateOne(userQuery, { $inc: { points: Number(points) } });
  // Verificar medalhas
  if (category === 'video' || category === 'incident' || category === 'training') {
    await checkActionBasedMedals(userId, category, details);
  }
}

/**
 * @function registerActivity
 * @description Controller de rota (mantém compatibilidade API REST)
 * @param {Request} req - Objeto da requisição Express (espera `req.body` com dados da atividade).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 201 e dados da atividade/medalhas ou um erro (400/500).
 */
export const registerActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, category, activityId, points, details } = req.body;
    await registerActivityData({ userId, category, activityId, points, details });
    res.status(201).json({ message: 'Atividade registrada com sucesso' });
  } catch (error) {
    logger.error('Erro ao registrar atividade:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      requestBody: req.body,
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      message: 'Erro ao registrar atividade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * @function generateActivityDescription
 * @description Função auxiliar para criar uma descrição textual legível para uma atividade,
 * baseando-se na sua categoria e nos detalhes armazenados.
 * @param {UserActivity} activity - O objeto da atividade do usuário.
 * @returns {string} Uma string descritiva da atividade.
 */
function generateActivityDescription(activity: UserActivity): string {
  // Usa um switch na categoria da atividade para gerar descrições diferentes.
  switch (activity.category) {
    case 'video':
      // Tenta usar o título do vídeo, se disponível nos detalhes.
      if (activity.details?.title) {
        return `Assistiu vídeo: '${activity.details.title}'`;
      }
      // Se não houver título, mas houver contagem > 1 (caso de agregação futura?)
      if (activity.details?.count && activity.details.count > 1) {
        return `Assistiu ${activity.details.count} vídeos de segurança`;
      }
      // Descrição genérica para vídeo.
      return 'Assistiu um vídeo de segurança';

    case 'incident':
      // Tenta usar o título do incidente.
      if (activity.details?.title) {
        return `Reportou quase acidente: '${activity.details.title}'`;
      }
      // Tenta usar o tipo do incidente.
      if (activity.details?.type) {
        return `Reportou quase acidente do tipo ${activity.details.type}`;
      }
      // Descrição genérica para incidente.
      return 'Reportou um quase acidente';

    case 'training':
      // Tenta usar o título da formação.
      if (activity.details?.title) {
        return `Completou formação: '${activity.details.title}'`;
      }
      // Verifica se é um curso completo.
      if (activity.details?.isFullCourse) {
        return 'Completou curso completo de segurança';
      }
      // Descrição genérica para formação.
      return 'Completou um módulo de formação';

    case 'medal':
      // Tenta usar o nome da medalha.
      if (activity.details?.name) {
        return `Medalha desbloqueada: '${activity.details.name}'`;
      }
      // Descrição genérica para medalha.
      return 'Conquistou uma nova medalha';

    default:
      // Descrição padrão para categorias não reconhecidas.
      return 'Realizou uma atividade na plataforma';
  }
}

/**
 * @function getUserActivities
 * @description Controladora para buscar o histórico de atividades recentes de um usuário específico.
 * Recebe o ID do usuário via `req.params`.
 * Busca as atividades na coleção 'user_activities', ordenadas por data descendente.
 * Formata as atividades (gera descrição, converte ID e data) antes de enviá-las.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.userId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de atividades formatadas ou um erro (400/500).
 */
export const getUserActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; // ID do usuário da URL.
    // Limite de atividades a serem retornadas (padrão 10), obtido da query string.
    const limit = parseInt(req.query.limit as string) || 10;

    // Validação: Verifica se o ID do usuário foi fornecido.
    if (!userId) {
      logger.warn('Requisição para buscar atividades sem userId.');
      res.status(400).json({ message: 'ID de usuário é obrigatório' });
      return;
    }

    logger.info(`Buscando ${limit} atividades mais recentes do usuário ${userId}`);

    // Obtém a coleção 'user_activities'.
    const activities = await UserActivity.find({ userId })
      .sort({ timestamp: -1 }) // Ordena pela data/hora mais recente primeiro.
      .limit(limit) // Limita o número de resultados.
      .lean();

    // Formata as atividades antes de enviar para o frontend.
    const formattedActivities: FormattedActivity[] = activities.map(activity => {
      // Desestrutura o objeto da atividade, separando _id e timestamp.
      const { _id, timestamp, userId: activityUserId, ...rest } = activity;

      // Retorna um novo objeto formatado.
      return {
        id: _id instanceof ObjectId ? _id.toString() : String(_id), // Converte _id (ObjectId ou outro) para string.
        userId: activityUserId, // Mantém userId.
        ...rest, // Inclui os campos restantes (category, activityId, points, details).
        description: generateActivityDescription(activity as UserActivity), // Gera a descrição.
        // Converte o timestamp (Date ou string) para string ISO 8601.
        date: timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString()
      };
    });

    logger.info(`${formattedActivities.length} atividades formatadas encontradas para o usuário ${userId}`);
    // Responde com o array de atividades formatadas.
    res.json(formattedActivities);

  } catch (error) {
    // Captura erros gerais.
    logger.error('Erro ao buscar atividades do usuário:', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Responde com erro 500 Internal Server Error.
    res.status(500).json({
      message: 'Erro ao buscar atividades',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * @function getFeed
 * @description Controladora para gerar um feed de atividades/novidades unificado.
 * Combina os Quase Acidentes (da coleção 'incidents'), Acidentes e Sensibilizações
 * mais recentes, ordenados por data.
 * Utiliza agregação para buscar as contagens de likes e comentários para cada item do feed.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de itens do feed formatados ou um erro (400/500).
 */
export async function getFeed(req: Request, res: Response): Promise<void> {
  logger.info('Requisição recebida para buscar feed unificado...');
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    logger.info(`Limite definido para o feed: ${limit}`);

    if (limit <= 0) {
        logger.warn('Limite inválido solicitado para o feed', { limit });
        res.status(400).json({ error: 'O limite deve ser um número positivo.' });
        return;
    }

    // --- PASSO 1: Buscar os documentos base de cada tipo ---
    const recentQAs = await UserActivity.find({})
        .sort({ date: -1 })
        .limit(limit)
        .select('_id title date')
        .lean();
    logger.info(`Encontrados ${recentQAs.length} Quase Acidentes recentes.`);

    const recentAccidents = await Accident.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name createdAt')
        .lean()
        .exec();
    logger.info(`Encontrados ${recentAccidents.length} Acidentes recentes.`);

    const recentSensibilizacoes = await Sensibilizacao.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name createdAt')
        .lean()
        .exec();
    logger.info(`Encontradas ${recentSensibilizacoes.length} Sensibilizações recentes.`);

    // --- PASSO 2: Formatar e Combinar os Itens Base ---
    let combinedBaseItems = [
      ...recentQAs.map(qa => ({
        _id: qa._id,
        type: 'qa' as const,
        title: qa.title,
        date: qa.date,
      })),
      ...recentAccidents.map(doc => ({
        _id: doc._id,
        type: 'document' as const,
        title: doc.name,
        date: doc.createdAt,
        documentType: 'Acidente' as const
      })),
      ...recentSensibilizacoes.map(doc => ({
        _id: doc._id,
        type: 'document' as const,
        title: doc.name,
        date: doc.createdAt,
        documentType: 'Sensibilizacao' as const
      }))
    ];
    logger.info(`Total de ${combinedBaseItems.length} itens base combinados antes da ordenação final.`);

    // --- PASSO 3: Ordenar e Limitar Itens Base Combinados ---
    combinedBaseItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    const topItems = combinedBaseItems.slice(0, limit);
    const itemIds = topItems.map(item => item._id);
    logger.info(`Selecionados os ${topItems.length} itens mais recentes para o feed.`);

    // --- PASSO 4: Buscar Contagens de Likes e Comments para os Itens Selecionados ---
    const likeCounts = await Like.aggregate([
        { $match: { itemId: { $in: itemIds } } },
        { $group: { _id: '$itemId', count: { $sum: 1 } } }
    ]);
    logger.info(`Contagem de likes obtida para ${likeCounts.length} itens.`);

    const commentCounts = await Comment.aggregate([
        { $match: { itemId: { $in: itemIds } } },
        { $group: { _id: '$itemId', count: { $sum: 1 } } }
    ]);
    logger.info(`Contagem de comentários obtida para ${commentCounts.length} itens.`);

    const likesMap = new Map(likeCounts.map(item => [item._id.toString(), item.count]));
    const commentsMap = new Map(commentCounts.map(item => [item._id.toString(), item.count]));

    // --- PASSO 5: Formatar a Resposta Final ---
    const finalFeed: FeedItem[] = topItems.map(item => ({
      _id: item._id.toString(),
      type: item.type,
      title: item.title,
      date: item.date.toISOString(),
      documentType: item.documentType,
      likeCount: likesMap.get(item._id.toString()) || 0,
      commentCount: commentsMap.get(item._id.toString()) || 0
    }));

    // --- PASSO 6: Buscar e Incluir Atividades de Like e Comentário ---
    const recentActivities = await UserActivity.find({
      category: { $in: ['incident', 'training'] },
      'details.action': { $in: ['like', 'comment'] }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
    logger.info(`Encontradas ${recentActivities.length} atividades de like/comentário recentes.`);

    // Formatar atividades de like e comentário como FeedItem
    const activityFeedItems: FeedItem[] = recentActivities.map(activity => {
      const { _id, userId, category, activityId, timestamp, details } = activity;
      return {
        _id: _id.toString(),
        type: 'activity' as const, // Novo tipo para diferenciar
        title: details.itemTitle || 'Item sem título',
        date: timestamp.toISOString(),
        documentType: details.itemType === 'qa' ? 'Quase Acidente' : details.itemType === 'accident' ? 'Acidente' : 'Sensibilizacao',
        action: details.action, // 'like' ou 'comment'
        userName: details.userName || 'Utilizador Desconhecido',
        commentText: details.commentText // Texto do comentário, se for uma atividade de comentário
      };
    });

    // Combinar e ordenar todos os itens do feed
    const allFeedItems = [...finalFeed, ...activityFeedItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);

    logger.info(`Retornando ${allFeedItems.length} itens formatados para o feed com contagens de interações e atividades.`);
    res.json(allFeedItems);

  } catch (error: unknown) {
    logger.error('Erro ao buscar feed unificado:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query
    });
    res.status(500).json({
        error: 'Erro ao buscar feed de novidades',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
// --- Fim da Função getFeed --- 