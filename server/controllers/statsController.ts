import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import { ObjectId } from 'mongodb';
import logger from '../utils/logger';
import { User } from '../types/user';
import { UserMedal } from '../types/userMedal';
import { Medal } from '../types/medal';

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

/**
 * Obtém a distribuição de pontos do usuário por categoria de atividade
 */
export const getUserPointsBreakdown = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      logger.warn('Solicitação de pontos sem ID de usuário');
      return res.status(400).json({ message: 'ID de usuário é obrigatório' });
    }
    
    logger.info(`Buscando distribuição de pontos para o usuário ${userId}`);
    
    // Obtém a coleção de atividades do usuário
    const activitiesCollection = await getCollection('user_activities');
    
    // Consulta as atividades do usuário agrupadas por categoria
    const pointsByCategory = await activitiesCollection.aggregate([
      { $match: { userId } },
      { $group: {
          _id: "$category",
          totalPoints: { $sum: "$points" }
        }
      }
    ]).toArray();
    
    // Define as cores para cada categoria
    const categoryColors = {
      'video': '#0071CE',  // Azul para vídeos
      'incident': '#FF7A00', // Laranja para incidentes
      'training': '#28a745'  // Verde para formações
    };
    
    // Mapeia os resultados para o formato esperado
    const result: UserPointsBreakdown[] = pointsByCategory.map(item => ({
      category: formatCategoryName(item._id),
      points: item.totalPoints,
      color: categoryColors[item._id] || '#6c757d' // Cinza como cor padrão
    }));
    
    // Se não houver dados para alguma categoria, adiciona com valor zero
    const categories = ['video', 'incident', 'training'];
    categories.forEach(category => {
      const exists = result.some(item => item.category === formatCategoryName(category));
      if (!exists) {
        result.push({
          category: formatCategoryName(category),
          points: 0,
          color: categoryColors[category]
        });
      }
    });
    
    logger.info(`Distribuição de pontos recuperada com sucesso`, { userId, categories: result.length });
    res.json(result);
    
  } catch (error) {
    logger.error('Erro ao buscar distribuição de pontos do usuário', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    res.status(500).json({ 
      message: 'Erro ao buscar distribuição de pontos',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Obtém o ranking do usuário em relação a todos os usuários
 */
export const getUserRanking = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      logger.warn('Solicitação de ranking sem ID de usuário');
      return res.status(400).json({ message: 'ID de usuário é obrigatório' });
    }
    
    logger.info(`Buscando ranking para o usuário ${userId}`);
    
    // Obtém a coleção de usuários
    const usersCollection = await getCollection('users');
    
    // Obtém todos os usuários ordenados por pontos (decrescente)
    const usersSorted = await usersCollection.find({}).sort({ points: -1 }).toArray();
    
    // Conta total de usuários
    const totalUsers = usersSorted.length;
    
    // Encontra a posição do usuário atual
    const userPosition = usersSorted.findIndex(user => user.id === userId) + 1;
    
    // Obtém os pontos do usuário
    const user = await usersCollection.findOne({ id: userId });
    const userPoints = user ? user.points : 0;
    
    const result: UserRanking = {
      position: userPosition > 0 ? userPosition : totalUsers,
      totalUsers,
      points: userPoints
    };
    
    logger.info(`Ranking recuperado com sucesso`, { 
      userId, 
      position: result.position,
      totalUsers: result.totalUsers
    });
    
    res.json(result);
    
  } catch (error) {
    logger.error('Erro ao buscar ranking do usuário', {
      userId: req.params.userId,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    res.status(500).json({ 
      message: 'Erro ao buscar ranking do usuário',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
};

/**
 * Formata o nome da categoria para exibição
 */
function formatCategoryName(category: string): string {
  switch (category) {
    case 'video':
      return 'Vídeos Assistidos';
    case 'incident':
      return 'Quase Acidentes';
    case 'training':
      return 'Formações Concluídas';
    default:
      return category.charAt(0).toUpperCase() + category.slice(1);
  }
}

// Obter Leaderboard Geral
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const usersCollection = await getCollection<User>('users');
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const medalsCollection = await getCollection<Medal>('medals');

    // Buscar todos os usuários
    const users = await usersCollection.find({}, {
      projection: { _id: 1, name: 1, points: 1 } 
    }).toArray();

    // Buscar todas as definições de medalhas para mapeamento fácil
    const allMedals = await medalsCollection.find({}, {
      projection: { _id: 1, name: 1, imageSrc: 1, requiredPoints: 1 }
    }).toArray();
    const medalsMap = new Map(allMedals.map(m => [m._id.toString(), m]));

    // Obter medalhas e top 3 para cada usuário
    const leaderboardData = await Promise.all(users.map(async (user) => {
      // Buscar as medalhas do usuário
      const userMedalsDocs = await userMedalsCollection.find({ userId: user._id.toString() }).toArray();
      const medalCount = userMedalsDocs.length;
      
      // Mapear para obter detalhes completos das medalhas
      const userFullMedals = userMedalsDocs
        .map(um => medalsMap.get(um.medalId))
        .filter((medal): medal is Medal => !!medal);

      // Ordenar por pontos necessários (descendente) e pegar top 3
      const topMedals = userFullMedals
        .sort((a, b) => (b.requiredPoints || 0) - (a.requiredPoints || 0))
        .slice(0, 3)
        .map(m => ({ name: m.name, imageSrc: m.imageSrc }));

      return {
        _id: user._id.toString(),
        name: user.name || `Utilizador ${user._id.toString().substring(0, 5)}`,
        points: user.points || 0,
        medalCount: medalCount,
        topMedals: topMedals
      };
    }));

    // Ordenar por pontos (descendente), depois por contagem de medalhas (descendente), depois por nome (ascendente)
    leaderboardData.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      if (b.medalCount !== a.medalCount) {
        return b.medalCount - a.medalCount;
      }
      return a.name.localeCompare(b.name);
    });

    // Adicionar ranking
    const rankedLeaderboard = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    logger.info('Leaderboard recuperado com sucesso', { count: rankedLeaderboard.length });
    res.json(rankedLeaderboard);

  } catch (error) {
    logger.error('Erro ao recuperar leaderboard', { error });
    res.status(500).json({ message: 'Erro ao recuperar leaderboard' });
  }
}; 