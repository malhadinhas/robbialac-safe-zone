import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

export interface Medal {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  category: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserMedal {
  id: string;
  userId: string;
  medalId: string;
  dateEarned: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Buscar todas as medalhas
export const getMedals = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Medal>('medals');
    const medals = await collection.find().toArray();
    
    logger.info('Medalhas recuperadas com sucesso', { count: medals.length });
    res.json(medals);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas', { error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas' });
  }
};

// Buscar medalhas de um usuário específico
export const getUserMedals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Buscar as relações entre usuário e medalhas
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const userMedals = await userMedalsCollection.find({ userId }).toArray();
    
    if (userMedals.length === 0) {
      logger.info('Nenhuma medalha encontrada para o usuário', { userId });
      return res.json([]);
    }
    
    // Obter os IDs das medalhas que o usuário possui
    const medalIds = userMedals.map(userMedal => userMedal.medalId);
    
    // Buscar as medalhas completas
    const medalsCollection = await getCollection<Medal>('medals');
    const medals = await medalsCollection.find({ id: { $in: medalIds } }).toArray();
    
    // Adicionar data de obtenção a cada medalha
    const medalsWithEarnedDate = medals.map(medal => {
      const userMedal = userMedals.find(um => um.medalId === medal.id);
      return {
        ...medal,
        dateEarned: userMedal?.dateEarned,
        acquired: true,
        acquiredDate: userMedal?.dateEarned
      };
    });
    
    logger.info('Medalhas do usuário recuperadas com sucesso', { userId, count: medals.length });
    res.json(medalsWithEarnedDate);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas do usuário', { userId: req.params.userId, error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas do usuário' });
  }
};

// Buscar medalhas não conquistadas por um usuário
export const getUserUnacquiredMedals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Buscar as relações entre usuário e medalhas
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const userMedals = await userMedalsCollection.find({ userId }).toArray();
    
    // Obter os IDs das medalhas que o usuário possui
    const medalIds = userMedals.map(userMedal => userMedal.medalId);
    
    // Buscar todas as medalhas
    const medalsCollection = await getCollection<Medal>('medals');
    const allMedals = await medalsCollection.find().toArray();
    
    // Filtrar apenas as não conquistadas
    const unacquiredMedals = allMedals.filter(medal => !medalIds.includes(medal.id))
      .map(medal => ({
        ...medal,
        acquired: false
      }));
    
    logger.info('Medalhas não conquistadas recuperadas com sucesso', { userId, count: unacquiredMedals.length });
    res.json(unacquiredMedals);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas não conquistadas', { userId: req.params.userId, error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas não conquistadas' });
  }
}; 