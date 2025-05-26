import { Request, Response } from 'express';
import Medal from '../models/Medal';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';
import { UserActivity } from '../models/UserActivity';
import UserMedal from '../models/UserMedal';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export interface Medal {
  _id?: ObjectId;
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  triggerAction: 'incidentReported' | 'videoWatched' | 'trainingCompleted';
  triggerCategory?: string;
  requiredCount: number;
  created_at?: Date;
  updated_at?: Date;
}

export const getAllMedals = async (_req: Request, res: Response) => {
  try {
    const medals = await Medal.find().lean();
    res.json(medals);
  } catch (error) {
    logger.error('Erro ao buscar medalhas:', error);
    res.status(500).json({ message: 'Erro ao buscar medalhas' });
  }
};

export const assignMedalToUser = async (userId: string, medalId: string) => {
  try {
    const existing = await UserMedal.findOne({ userId, medalId });
    if (!existing) {
      await new UserMedal({ userId, medalId }).save();
      logger.info(`Medalha ${medalId} atribuída ao utilizador ${userId}`);
    }
  } catch (error) {
    logger.error('Erro ao atribuir medalha:', error);
  }
};

export const checkActionBasedMedals = async (userId: string) => {
  try {
    const allMedals = await Medal.find().lean();
    const activities = await UserActivity.find({ userId }).lean();

    for (const medal of allMedals) {
      const relevant = activities.filter(
        (a: any) =>
          a.category === 'interaction' &&
          a.action === medal.triggerAction &&
          (!medal.triggerCategory || a.details?.category === medal.triggerCategory)
      );

      const count = relevant.length;
      const required = medal.requiredCount ?? 1;

      if (count >= required) {
        await assignMedalToUser(userId, medal.id);
      }
    }
  } catch (error) {
    logger.error('Erro ao verificar atribuição automática de medalhas:', error);
  }
};
