import api from '@/lib/api';

export interface UserPointsBreakdown {
  category: string;
  points: number;
  color: string;
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
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