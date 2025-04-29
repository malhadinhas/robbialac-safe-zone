/**
 * @module server/controllers/activityController
 * @description Este módulo contém as funções controladoras para registrar e buscar
 * atividades dos usuários, como visualização de vídeos, reporte de incidentes,
 * conclusão de treinamentos e conquista de medalhas. Também inclui uma função
 * para gerar um feed de atividades recentes unificado (combinando Quase Acidentes,
 * Acidentes e Sensibilizações) com contagem de interações (likes/comentários).
 */
import { Request, Response } from 'express';
import { getCollection } from '../services/database'; // Função para obter uma coleção MongoDB
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

/**
 * @interface FeedItem
 * @description Define a estrutura de um item no feed de atividades unificado.
 * Inclui tipo (QA ou Documento), título, data e contagens opcionais de likes/comentários.
 */
interface FeedItem {
  _id: string; // ID do item (QA, Acidente, Sensibilização) como string
  type: 'qa' | 'document'; // Tipo do item: 'qa' para Quase Acidente, 'document' para Acidente/Sensibilização
  title: string; // Título ou nome do item
  date: string; // Data do item em formato string ISO 8601
  documentType?: 'Acidente' | 'Sensibilizacao'; // Subtipo, se for um documento
  likeCount?: number; // Contagem de Likes (opcional)
  commentCount?: number; // Contagem de Comentários (opcional)
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
  details?: any; // Campo opcional para armazenar detalhes extras sobre a atividade
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
  details?: any; // Detalhes extras
}

/**
 * @function registerActivity
 * @description Controladora para registrar uma nova atividade realizada por um usuário.
 * Recebe os detalhes da atividade via `req.body`.
 * Valida os dados, salva a atividade na coleção 'user_activities',
 * atualiza os pontos totais do usuário na coleção 'users', e
 * verifica se a ação resultou na conquista de novas medalhas.
 * @param {Request} req - Objeto da requisição Express (espera `req.body` com dados da atividade).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 201 e dados da atividade/medalhas ou um erro (400/500).
 */
export const registerActivity = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extrai dados do corpo da requisição.
    const { userId, category, activityId, points, details } = req.body;

    // Validação 1: Verifica se os campos obrigatórios foram fornecidos.
    if (!userId || !category || !activityId || points === undefined) {
      logger.warn('Tentativa de registrar atividade com dados incompletos', { userId, category, activityId, points });
      res.status(400).json({ message: 'Dados incompletos para registro de atividade' });
      return; // Para a execução.
    }

    // Validação 2: Verifica se a categoria é uma das permitidas.
    const validCategories = ['video', 'incident', 'training', 'medal'];
    if (!validCategories.includes(category)) {
      logger.warn(`Categoria inválida recebida: ${category}`, { userId, activityId });
      res.status(400).json({ message: 'Categoria inválida' });
      return; // Para a execução.
    }

    // Cria o objeto da atividade a ser salvo no banco.
    const activity: UserActivity = {
      userId,
      category,
      activityId,
      points: Number(points), // Garante que 'points' seja um número.
      timestamp: new Date(), // Define o timestamp como a hora atual.
      details // Inclui detalhes adicionais, se fornecidos.
    };

    logger.info(`Registrando nova atividade para usuário ${userId}`, { category, points, activityId });

    // Obtém a coleção 'user_activities' do banco de dados.
    const collection = await getCollection<UserActivity>('user_activities');
    // Insere o documento da nova atividade na coleção.
    const result = await collection.insertOne(activity);
    const insertedId = result.insertedId; // ID do documento da atividade inserido.

    // --- Atualização de Pontos do Usuário ---
    // Obtém a coleção 'users'.
    const usersCollection = await getCollection('users');
    // Tenta encontrar o usuário pelo _id (ObjectId) ou pelo campo 'id' (string, se existir).
    const userObjectId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : null;
    const userQuery = userObjectId ? { _id: userObjectId } : { id: userId }; // Adapta a query

    // Incrementa o campo 'points' do usuário encontrado pelo valor de 'points' da atividade.
    const updateResult = await usersCollection.updateOne(
      userQuery, // Critério para encontrar o usuário
      { $inc: { points: Number(points) } } // Operador de incremento atômico
    );

    // Verifica se algum usuário foi encontrado e atualizado.
    if (updateResult.matchedCount === 0) {
      // Se nenhum usuário foi encontrado, loga um aviso. A atividade ainda foi registrada.
      logger.warn(`Usuário não encontrado para atualização de pontos: ${userId}`);
    } else {
        logger.info(`Pontos do usuário ${userId} atualizados.`);
    }

    // --- Verificação de Medalhas ---
    // Obtém os pontos totais atualizados do usuário (opcional, mas bom para log).
    const user = await usersCollection.findOne(userQuery);
    const updatedPoints = user?.points || 0; // Pontos atuais ou 0 se não encontrado.
    logger.info(`Pontos totais atuais do usuário ${userId}: ${updatedPoints}`);

    // Chama a função do medalController para verificar se esta ação desbloqueou novas medalhas.
    const newMedals = await checkActionBasedMedals(userId, category, details);

    // Verifica se a função retornou alguma medalha nova.
    if (newMedals && newMedals.length > 0) {
      logger.info(`Usuário ${userId} ganhou ${newMedals.length} novas medalhas por esta ação!`, { medals: newMedals.map(m => m.name) });

      // Para cada nova medalha conquistada, registra uma atividade do tipo 'medal'.
      // Isso faz com que a conquista da medalha apareça no histórico de atividades.
      for (const medal of newMedals) {
        const medalActivity: UserActivity = {
          userId,
          category: 'medal', // Categoria específica para conquista de medalha.
          activityId: medal.id, // ID da medalha conquistada.
          points: 0, // Conquistar medalha geralmente não dá pontos extras diretos.
          timestamp: new Date(), // Timestamp da conquista.
          details: { // Detalhes da medalha para exibição no histórico.
            name: medal.name,
            description: medal.description,
            imageSrc: medal.imageSrc
          }
        };
        // Insere a atividade da medalha na coleção 'user_activities'.
        await collection.insertOne(medalActivity);
        logger.info(`Medalha '${medal.name}' registrada como atividade.`, { userId, medalId: medal.id });
      }
    }

    // Responde com sucesso (status 201 Created).
    res.status(201).json({
      message: 'Atividade registrada com sucesso',
      activityId: insertedId, // ID da atividade principal registrada.
      points: Number(points), // Pontos ganhos.
      // Inclui informações sobre as novas medalhas, se houver.
      newMedals: newMedals && newMedals.length > 0 ? newMedals.map(m => ({ id: m.id, name: m.name })) : undefined
    });

  } catch (error) {
    // Captura erros gerais.
    logger.error('Erro ao registrar atividade:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      requestBody: req.body, // Loga o corpo da requisição que causou o erro.
      stack: error instanceof Error ? error.stack : undefined
    });
    // Responde com erro 500 Internal Server Error.
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
      return res.status(400).json({ message: 'ID de usuário é obrigatório' });
    }

    logger.info(`Buscando ${limit} atividades mais recentes do usuário ${userId}`);

    // Obtém a coleção 'user_activities'.
    const collection = await getCollection<UserActivity>('user_activities');
    // Busca as atividades do usuário especificado.
    const activities = await collection.find({ userId })
      .sort({ timestamp: -1 }) // Ordena pela data/hora mais recente primeiro.
      .limit(limit) // Limita o número de resultados.
      .toArray(); // Converte o cursor para um array.

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
    // Obtém o limite de itens do feed da query string, com padrão 10.
    const limit = parseInt(req.query.limit as string) || 10;
    logger.info(`Limite definido para o feed: ${limit}`);

    // Validação: Garante que o limite seja um número positivo.
    if (limit <= 0) {
        logger.warn('Limite inválido solicitado para o feed', { limit });
        res.status(400).json({ error: 'O limite deve ser um número positivo.' });
        return; // Para a execução.
    }

    // --- PASSO 1: Buscar os documentos base de cada tipo ---
    // Buscar Quase Acidentes (coleção 'incidents' via getCollection)
    const incidentsCollection = await getCollection<Incident>('incidents');
    // Busca os 'limit' QAs mais recentes, projetando apenas os campos necessários (_id, title, date).
    const recentQAs = await incidentsCollection.find({}) // Busca todos (sem filtro inicial)
        .sort({ date: -1 }) // Ordena por data descendente
        .limit(limit) // Limita a quantidade (busca um pouco mais para ter margem após combinação)
        .project({ _id: 1, title: 1, date: 1 }) // Seleciona apenas os campos necessários
        .toArray(); // Converte para array
    logger.info(`Encontrados ${recentQAs.length} Quase Acidentes recentes.`);

    // Buscar Acidentes (modelo Mongoose 'Accident')
    // Busca os 'limit' Acidentes mais recentes pela data de criação (createdAt).
    // Seleciona _id, name, createdAt. Usa lean() para obter objetos JS simples.
    const recentAccidents = await Accident.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name createdAt') // Seleciona campos
        .lean() // Retorna plain JavaScript objects, não documentos Mongoose completos
        .exec(); // Executa a query
    logger.info(`Encontrados ${recentAccidents.length} Acidentes recentes.`);

    // Buscar Sensibilizações (modelo Mongoose 'Sensibilizacao')
    // Similar aos Acidentes.
    const recentSensibilizacoes = await Sensibilizacao.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('_id name createdAt')
        .lean()
        .exec();
    logger.info(`Encontradas ${recentSensibilizacoes.length} Sensibilizações recentes.`);

    // --- PASSO 2: Formatar e Combinar os Itens Base ---
    // Mapeia cada tipo de documento para uma estrutura comum e combina em um único array.
    let combinedBaseItems = [
      // Mapeia Quase Acidentes
      ...recentQAs.map(qa => ({
        _id: qa._id, // Mantém como ObjectId por enquanto para agregação posterior
        type: 'qa' as const, // Define o tipo como 'qa'
        title: qa.title, // Usa o campo 'title'
        date: qa.date, // Mantém como objeto Date para ordenação
      })),
      // Mapeia Acidentes
      ...recentAccidents.map(doc => ({
        _id: doc._id,
        type: 'document' as const, // Define o tipo como 'document'
        title: doc.name, // Usa o campo 'name' como título
        date: doc.createdAt, // Usa 'createdAt' como data
        documentType: 'Acidente' as const // Adiciona subtipo
      })),
      // Mapeia Sensibilizações
      ...recentSensibilizacoes.map(doc => ({
        _id: doc._id,
        type: 'document' as const,
        title: doc.name,
        date: doc.createdAt,
        documentType: 'Sensibilizacao' as const // Adiciona subtipo
      }))
    ];
    logger.info(`Total de ${combinedBaseItems.length} itens base combinados antes da ordenação final.`);

    // --- PASSO 3: Ordenar e Limitar Itens Base Combinados ---
    // Ordena o array combinado pela data (mais recente primeiro).
    combinedBaseItems.sort((a, b) => b.date.getTime() - a.date.getTime());
    // Pega apenas os 'limit' itens mais recentes do array combinado.
    const topItems = combinedBaseItems.slice(0, limit);
    // Extrai apenas os ObjectIds dos itens selecionados para usar na próxima agregação.
    const itemIds = topItems.map(item => item._id); // Array de ObjectIds
    logger.info(`Selecionados os ${topItems.length} itens mais recentes para o feed.`);

    // --- PASSO 4: Buscar Contagens de Likes e Comments para os Itens Selecionados ---
    // Usa agregação na coleção 'Like' para contar likes por itemId.
    const likeCounts = await Like.aggregate([
        // Filtra apenas likes cujo itemId está na lista 'itemIds'.
        { $match: { itemId: { $in: itemIds } } },
        // Agrupa por itemId e soma 1 para cada like encontrado (conta os likes).
        { $group: { _id: '$itemId', count: { $sum: 1 } } }
    ]);
    logger.info(`Contagem de likes obtida para ${likeCounts.length} itens.`);

    // Usa agregação na coleção 'Comment' para contar comentários por itemId.
    const commentCounts = await Comment.aggregate([
        // Filtra apenas comentários cujo itemId está na lista 'itemIds'.
        { $match: { itemId: { $in: itemIds } } },
        // Agrupa por itemId e soma 1 para cada comentário (conta os comentários).
        { $group: { _id: '$itemId', count: { $sum: 1 } } }
    ]);
    logger.info(`Contagem de comentários obtida para ${commentCounts.length} itens.`);

    // Cria Maps para acesso rápido às contagens usando o ID do item (como string).
    const likesMap = new Map(likeCounts.map(item => [item._id.toString(), item.count]));
    const commentsMap = new Map(commentCounts.map(item => [item._id.toString(), item.count]));

    // --- PASSO 5: Formatar a Resposta Final ---
    // Mapeia os 'topItems' para o formato final 'FeedItem'.
    const finalFeed: FeedItem[] = topItems.map(item => ({
      _id: item._id.toString(), // Converte ObjectId para string.
      type: item.type,
      title: item.title,
      date: item.date.toISOString(), // Converte Date para string ISO.
      documentType: item.documentType, // Inclui o subtipo do documento, se houver.
      // Busca a contagem de likes no Map, ou usa 0 se não encontrar.
      likeCount: likesMap.get(item._id.toString()) || 0,
      // Busca a contagem de comentários no Map, ou usa 0 se não encontrar.
      commentCount: commentsMap.get(item._id.toString()) || 0
    }));

    logger.info(`Retornando ${finalFeed.length} itens formatados para o feed com contagens de interações.`);
    // Responde com o array final do feed.
    res.json(finalFeed);

  } catch (error) {
    // Captura erros gerais no processo de geração do feed.
    logger.error('Erro ao buscar feed unificado:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query: req.query
    });
    // Responde com erro 500 Internal Server Error.
    res.status(500).json({
        error: 'Erro ao buscar feed de novidades',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}
// --- Fim da Função getFeed --- 