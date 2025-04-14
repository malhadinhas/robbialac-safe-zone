import api from '@/lib/api';

export interface UserPointsBreakdown {
  category: string;
  points: number;
  color: string;
}

export interface UserRanking {
  position: number;
  totalUsers: number;
  points: number;
}

/**
 * Busca a distribuição de pontos do usuário por tipo de atividade
 * @param userId ID do usuário
 * @returns Detalhamento dos pontos por categoria
 */
export async function getUserPointsBreakdown(userId?: string): Promise<UserPointsBreakdown[]> {
  try {
    if (!userId) {
      // Se não tiver userId, tenta obter do localStorage
      const user = JSON.parse(localStorage.getItem('robbialac_user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar pontos sem usuário autenticado');
      return getDefaultPointsDistribution();
    }
    
    try {
      const response = await api.get(`/stats/user/${userId}/points-breakdown`);
      
      // Se os dados vieram vazios ou não houve dados retornados, usa dados padrão
      if (!response.data || response.data.length === 0 || 
          response.data.every((item: UserPointsBreakdown) => item.points === 0)) {
        return getDefaultPointsDistribution();
      }
      
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar distribuição de pontos:', error);
      return getDefaultPointsDistribution();
    }
  } catch (error) {
    console.error('Erro ao buscar distribuição de pontos:', error);
    // Retorna dados padrão em caso de erro
    return getDefaultPointsDistribution();
  }
}

/**
 * Retorna uma distribuição padrão de pontos para novos utilizadores
 */
function getDefaultPointsDistribution(): UserPointsBreakdown[] {
  return [
    { category: "Vídeos Assistidos", points: 50, color: "#0071CE" },
    { category: "Quase Acidentes", points: 25, color: "#FF7A00" },
    { category: "Formações Concluídas", points: 25, color: "#28a745" }
  ];
}

/**
 * Busca o ranking do usuário na plataforma
 * @param userId ID do usuário
 * @returns Posição do usuário no ranking
 */
export async function getUserRanking(userId?: string): Promise<UserRanking> {
  try {
    if (!userId) {
      // Se não tiver userId, tenta obter do localStorage
      const user = JSON.parse(localStorage.getItem('robbialac_user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar ranking sem usuário autenticado');
      return getDefaultRanking();
    }
    
    try {
      const response = await api.get(`/stats/user/${userId}/ranking`);
      if (response.data) {
        return response.data;
      }
      
      // Se não tem dados de ranking ou estão vazios, retorna ranking padrão
      return getDefaultRanking();
    } catch (error) {
      console.error('Erro ao buscar ranking do usuário:', error);
      return getDefaultRanking();
    }
  } catch (error) {
    console.error('Erro ao buscar ranking do usuário:', error);
    return getDefaultRanking();
  }
}

/**
 * Retorna um ranking padrão para utilizadores novos
 */
function getDefaultRanking(): UserRanking {
  return {
    position: 1,
    totalUsers: 10,
    points: 100
  };
} 