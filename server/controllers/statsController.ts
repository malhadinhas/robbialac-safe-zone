import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import { ObjectId } from 'mongodb';
import logger from '../utils/logger';

interface UserPointsBreakdown {
  category: string;
  points: number;
  color: string;
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