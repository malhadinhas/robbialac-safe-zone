import api from '@/lib/api';

export interface Medal {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  dateEarned?: string;
  category: string;
  acquired?: boolean;
  acquiredDate?: string;
  image?: string;
}

/**
 * Busca todas as medalhas do usuário especificado
 * @param userId ID do usuário
 * @returns Uma lista de medalhas conquistadas pelo usuário
 */
export async function getUserMedals(userId?: string): Promise<Medal[]> {
  try {
    if (!userId) {
      // Se não tiver userId, tenta obter do localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar medalhas sem usuário autenticado');
      return [];
    }
    
    const response = await api.get(`/medals/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar medalhas:', error);
    // Retorna uma lista vazia em caso de erro
    return [];
  }
}

/**
 * Busca todas as medalhas disponíveis no sistema
 * @returns Uma lista de todas as medalhas
 */
export async function getAllMedals(): Promise<Medal[]> {
  try {
    const response = await api.get('/medals');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar todas as medalhas:', error);
    // Retorna uma lista vazia em caso de erro
    return [];
  }
}

/**
 * Busca medalhas não conquistadas por um usuário
 * @param userId ID do usuário
 * @returns Uma lista de medalhas não conquistadas
 */
export async function getUnacquiredMedals(userId?: string): Promise<Medal[]> {
  try {
    if (!userId) {
      // Se não tiver userId, tenta obter do localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      userId = user?.id;
    }
    
    if (!userId) {
      console.warn('Tentativa de buscar medalhas sem usuário');
      return [];
    }
    
    const response = await api.get(`/medals/user/${userId}/unacquired`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar medalhas não conquistadas:', error);
    return [];
  }
} 