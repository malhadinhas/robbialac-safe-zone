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
      return [];
    }
    
    const response = await api.get(`/stats/user/${userId}/points-breakdown`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar distribuição de pontos:', error);
    // Retorna dados padrão em caso de erro
    return [
      { category: "Vídeos Assistidos", points: 0, color: "#0071CE" },
      { category: "Quase Acidentes", points: 0, color: "#FF7A00" },
      { category: "Formações Concluídas", points: 0, color: "#28a745" }
    ];
  }
}

/**
 * Busca o ranking do usuário
 * @param userId ID do usuário
 * @returns Informações do ranking
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
      return { position: 0, totalUsers: 0, points: 0 };
    }
    
    const response = await api.get(`/stats/user/${userId}/ranking`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar ranking do usuário:', error);
    // Retorna dados padrão em caso de erro
    return { position: 0, totalUsers: 0, points: 0 };
  }
} 