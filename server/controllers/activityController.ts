import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

interface UserActivity {
  userId: string;
  category: 'video' | 'incident' | 'training';
  activityId: string;
  points: number;
  timestamp: Date;
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
    if (!['video', 'incident', 'training'].includes(category)) {
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
    const collection = await getCollection('user_activities');
    const result = await collection.insertOne(activity);
    
    // Atualizar os pontos totais do usuário
    const usersCollection = await getCollection('users');
    
    // Usando updateOne com $inc para incrementar os pontos do usuário de forma atômica
    await usersCollection.updateOne(
      { _id: userId },
      { $inc: { points: points } }
    );
    
    logger.info(`Atividade registrada com sucesso, ${points} pontos adicionados`, {
      userId,
      activityId,
      category
    });
    
    res.status(201).json({
      message: 'Atividade registrada com sucesso',
      activityId: result.insertedId,
      points
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
    
    const collection = await getCollection('user_activities');
    const activities = await collection.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    logger.info(`${activities.length} atividades encontradas para o usuário ${userId}`);
    res.json(activities);
    
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