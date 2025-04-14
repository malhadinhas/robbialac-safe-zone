import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';
import { checkActionBasedMedals } from './medalController';

interface UserActivity {
  _id?: ObjectId;
  userId: string;
  category: 'video' | 'incident' | 'training' | 'medal';
  activityId: string;
  points: number;
  timestamp: Date;
  details?: any;
}

interface FormattedActivity {
  id: string;
  userId: string;
  category: string;
  activityId: string;
  description: string;
  points: number;
  date: string;
  details?: any;
}

/**
 * Registra uma nova atividade de usuário e seus pontos
 */
export const registerActivity = async (req: Request, res: Response) => {
  try {
    const { userId, category, activityId, points, details } = req.body;
    
    // Validar dados obrigatórios
    if (!userId || !category || !activityId || points === undefined) {
      logger.warn('Tentativa de registrar atividade com dados incompletos', { 
        userId, category, activityId, points 
      });
      return res.status(400).json({ message: 'Dados incompletos para registro de atividade' });
    }
    
    // Validar a categoria
    if (!['video', 'incident', 'training', 'medal'].includes(category)) {
      logger.warn(`Categoria inválida: ${category}`);
      return res.status(400).json({ message: 'Categoria inválida' });
    }
    
    // Criar o objeto da atividade
    const activity: UserActivity = {
      userId,
      category,
      activityId,
      points: Number(points),
      timestamp: new Date(),
      details
    };
    
    logger.info(`Registrando atividade para usuário ${userId}`, { 
      category, points, activityId 
    });
    
    // Salvar no banco de dados
    const collection = await getCollection<UserActivity>('user_activities');
    const result = await collection.insertOne(activity);
    const insertedId = result.insertedId;
    
    // Atualizar os pontos totais do usuário
    const usersCollection = await getCollection('users');
    
    const updateResult = await usersCollection.updateOne(
      { $or: [{ _id: new ObjectId(userId) }, { id: userId }] },
      { $inc: { points: points } }
    );
    
    if (updateResult.matchedCount === 0) {
      logger.warn(`Usuário não encontrado para atualização de pontos: ${userId}`);
    }
    
    // Obter pontos atualizados do usuário
    const user = await usersCollection.findOne({ $or: [{ _id: new ObjectId(userId) }, { id: userId }] });
    const updatedPoints = user?.points || 0;
    
    logger.info(`Atividade registrada com sucesso, ${points} pontos adicionados`, {
      userId,
      activityId,
      category,
      totalPoints: updatedPoints
    });
    
    // Chamamos a nova função que verifica medalhas baseadas na ação
    const newMedals = await checkActionBasedMedals(userId, category, details);
    
    // Se o usuário ganhou novas medalhas com a NOVA lógica, registrar atividades para cada uma
    if (newMedals && newMedals.length > 0) {
      logger.info(`Usuário ${userId} ganhou ${newMedals.length} novas medalhas!`);
      
      // Registrar atividade para cada medalha conquistada
      for (const medal of newMedals) {
        const medalActivity: UserActivity = {
          userId,
          category: 'medal',
          activityId: medal.id,
          points: 0,
          timestamp: new Date(),
          details: {
            name: medal.name,
            description: medal.description,
            imageSrc: medal.imageSrc
          }
        };
        
        await collection.insertOne(medalActivity);
        logger.info(`Medalha registrada como atividade: ${medal.name}`, { userId, medalId: medal.id });
      }
    }
    
    res.status(201).json({
      message: 'Atividade registrada com sucesso',
      activityId: insertedId,
      points,
      newMedals: newMedals && newMedals.length > 0 ? newMedals.map(m => ({ id: m.id, name: m.name })) : undefined
    });
    
  } catch (error) {
    logger.error('Erro ao registrar atividade:', {
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      body: req.body
    });
    
    res.status(500).json({
      message: 'Erro ao registrar atividade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Gera uma descrição para a atividade baseada na categoria e nos detalhes
 */
function generateActivityDescription(activity: UserActivity): string {
  switch (activity.category) {
    case 'video':
      if (activity.details?.title) {
        return `Assistiu vídeo: '${activity.details.title}'`;
      }
      if (activity.details?.count && activity.details.count > 1) {
        return `Assistiu ${activity.details.count} vídeos de segurança`;
      }
      return 'Assistiu um vídeo de segurança';
      
    case 'incident':
      if (activity.details?.title) {
        return `Reportou quase acidente: '${activity.details.title}'`;
      }
      if (activity.details?.type) {
        return `Reportou quase acidente do tipo ${activity.details.type}`;
      }
      return 'Reportou um quase acidente';
      
    case 'training':
      if (activity.details?.title) {
        return `Completou formação: '${activity.details.title}'`;
      }
      if (activity.details?.isFullCourse) {
        return 'Completou curso completo de segurança';
      }
      return 'Completou um módulo de formação';
      
    case 'medal':
      if (activity.details?.name) {
        return `Medalha desbloqueada: '${activity.details.name}'`;
      }
      return 'Conquistou uma nova medalha';
      
    default:
      return 'Realizou uma atividade na plataforma';
  }
}

/**
 * Obtém o histórico de atividades de um usuário
 */
export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (!userId) {
      return res.status(400).json({ message: 'ID de usuário é obrigatório' });
    }
    
    logger.info(`Buscando atividades do usuário ${userId}`);
    
    const collection = await getCollection<UserActivity>('user_activities');
    const activities = await collection.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    // Formatar as atividades para o frontend
    const formattedActivities: FormattedActivity[] = activities.map(activity => {
      const { _id, timestamp, userId: activityUserId, ...rest } = activity;
      
      return {
        id: _id instanceof ObjectId ? _id.toString() : String(_id),
        userId: activityUserId,
        ...rest,
        description: generateActivityDescription(activity as UserActivity),
        date: timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString()
      };
    });
    
    logger.info(`${activities.length} atividades encontradas para o usuário ${userId}`);
    res.json(formattedActivities);
    
  } catch (error) {
    logger.error('Erro ao buscar atividades do usuário:', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    res.status(500).json({
      message: 'Erro ao buscar atividades',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}; 