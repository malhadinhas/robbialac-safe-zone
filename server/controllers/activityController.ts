import { Request, Response } from 'express';
import { UserActivity } from '../models/UserActivity';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';
import { checkActionBasedMedals } from './medalController';
import User from '../models/User';

interface FormattedActivity {
  description: string;
  date: string;
  action: any;
  category: string;
  activityId: string;
  points: number;
}

export async function getUserActivities(req: Request, res: Response) {
  try {
    const userId = req.params.id;
    const activities = await UserActivity.find({ userId }).lean();

    const formattedActivities = activities.map((activity: any): FormattedActivity => {
      const count = Number(activity.details?.count ?? 0);
      return {
        description: generateActivityDescription(activity),
        date: new Date(activity.timestamp).toLocaleDateString(),
        action: activity.action,
        category: activity.category,
        activityId: activity._id.toString(),
        points: activity.points || 0
      };
    });

    res.json(formattedActivities);
  } catch (error) {
    logger.error('Erro ao buscar atividades do usuário:', { error });
    res.status(500).json({ error: 'Erro ao buscar atividades' });
  }
}

function generateActivityDescription(activity: any): string {
  const count = Number(activity.details?.count ?? 0);
  const category = activity.category;
  if (category === 'incident' && count > 1) {
    return `Participou de ${count} incidentes`;
  }
  return `Participou de uma atividade na categoria ${category}`;
}

// NOVA: Registar uma atividade
export async function registerActivity(req: Request, res: Response): Promise<void> {
  try {
    const { userId, category, action, details } = req.body;

    if (!userId || !category || !action) {
      res.status(400).json({ message: 'Campos obrigatórios em falta.' });
      return;
    }

    const activity = new UserActivity({
      userId,
      category,
      action,
      details,
      timestamp: new Date()
    });

    await activity.save();

    // Verifica se há medalhas a atribuir
    await checkActionBasedMedals(userId);

    res.status(201).json({ message: 'Atividade registada com sucesso', activity });
  } catch (error) {
    logger.error('Erro ao registar atividade:', error);
    res.status(500).json({ message: 'Erro ao registar atividade' });
  }
}

// NOVA: Obter feed de atividades
export async function getFeed(req: Request, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = await UserActivity.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name')
      .lean();

    const formatted = activities.map((activity: any) => ({
      id: activity._id,
      userName: activity.userId?.name || 'Utilizador',
      category: activity.category,
      action: activity.action,
      details: activity.details,
      timestamp: activity.timestamp
    }));

    res.json(formatted);
  } catch (error) {
    logger.error('Erro ao carregar feed de atividades:', error);
    res.status(500).json({ message: 'Erro ao carregar feed' });
  }
}
