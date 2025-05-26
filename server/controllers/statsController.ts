import { Request, Response } from 'express';
import User from '../models/User';
import UserMedal from '../models/UserMedal';
import Medal from '../models/Medal';
import logger from '../utils/logger';
import { UserActivity } from '../models/UserActivity';

interface UserPointsBreakdown {
  category: string;
  points: number;
  color: string;
}

interface UserRanking {
  position: number;
  totalUsers: number;
  points: number;
}

// Cores associadas a cada categoria
const categoryColors: Record<string, string> = {
  video: '#007bff',
  incident: '#dc3545',
  training: '#28a745'
};

export const getUserPoints = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const activities = await UserActivity.find({ userId }).lean();

    const pointsByCategory: Record<string, number> = {};

    activities.forEach((activity: any) => {
      const category = activity.category || 'unknown';
      pointsByCategory[category] = (pointsByCategory[category] || 0) + (activity.points || 0);
    });

    const breakdown: UserPointsBreakdown[] = Object.entries(pointsByCategory).map(([category, points]) => ({
      category,
      points,
      color: categoryColors[category] || '#6c757d' // cinzento como cor default
    }));

    res.status(200).json(breakdown);
  } catch (err) {
    logger.error('Erro ao calcular pontos por categoria:', err);
    res.status(500).json({ error: 'Erro interno ao calcular pontos' });
  }
};

export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const allUsers = await User.find({}).lean();

    const userScores = await Promise.all(
      allUsers.map(async (user: any) => {
        const activities = await UserActivity.find({ userId: user._id }).lean();
        const totalPoints = activities.reduce((sum, act: any) => sum + (act.points || 0), 0);
        return {
          userId: user._id,
          totalPoints
        };
      })
    );

    userScores.sort((a, b) => b.totalPoints - a.totalPoints);

    const userId = req.params.id;
    const userIndex = userScores.findIndex(score => score.userId.toString() === userId);

    const userRanking: UserRanking = {
      position: userIndex + 1,
      totalUsers: userScores.length,
      points: userScores[userIndex]?.totalPoints || 0
    };

    res.status(200).json(userRanking);
  } catch (err) {
    logger.error('Erro ao calcular ranking de utilizador:', err);
    res.status(500).json({ error: 'Erro interno ao calcular ranking' });
  }
};
