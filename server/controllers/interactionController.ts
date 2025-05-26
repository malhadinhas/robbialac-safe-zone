import { Request, Response } from 'express';
import Like from '../models/Like';
import Comment from '../models/Comment';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import { logActivity } from '../utils/logActivity'; // ✅ NOVO
import Accident from '../models/Accident';
import Sensibilizacao from '../models/Sensibilizacao';
import Incident from '../models/Incident';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

const isValidItemType = (type: string): type is 'qa' | 'accident' | 'sensibilizacao' => {
  return ['qa', 'accident', 'sensibilizacao'].includes(type);
};

// --- Likes ---

export const addLike = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, itemType } = req.body;
    const userId = req.user?.id;

    if (!userId || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
      return res.status(400).json({ message: 'Dados inválidos' });
    }

    const likeExists = await Like.findOne({ itemId, userId, itemType });

    if (likeExists) {
      return res.status(409).json({ message: 'Já gostaste deste item' });
    }

    const like = new Like({ itemId, userId, itemType });
    await like.save();

    await logActivity({
      userId,
      category: 'interaction',
      action: 'like',
      details: { itemType, itemId }
    });

    res.status(201).json({ message: 'Like registado com sucesso' });
  } catch (error) {
    logger.error('Erro ao adicionar like:', error);
    res.status(500).json({ message: 'Erro ao adicionar like' });
  }
};

// --- Comentários ---

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId, itemType, text } = req.body;
    const userId = req.user?.id;

    if (!userId || !isValidObjectId(itemId) || !isValidItemType(itemType) || !text) {
      return res.status(400).json({ message: 'Dados inválidos para comentário' });
    }

    const comment = new Comment({ itemId, itemType, userId, text });
    await comment.save();

    await logActivity({
      userId,
      category: 'interaction',
      action: 'comment',
      details: { itemType, itemId, text }
    });

    res.status(201).json({ message: 'Comentário adicionado com sucesso' });
  } catch (error) {
    logger.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro interno ao adicionar comentário' });
  }
};
