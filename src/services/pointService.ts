import api from '@/lib/api';

/**
 * Envia um pedido para o backend para atribuir pontos por visualização de vídeo.
 * 
 * @param videoId - O ID (_id) do vídeo visualizado.
 * @param userId - O ID (_id) do utilizador que visualizou.
 */
export async function awardVideoPoints(videoId: string, userId: string): Promise<void> {
  try {
    // Fazer um pedido POST para a nova rota da API
    // Passar videoId e userId no corpo do pedido
    await api.post('/points/video-view', { videoId, userId }); 
  } catch (error) {
    // O erro já é logado no componente, apenas relançar para react-query se necessário
    console.error("Service Error: Falha ao chamar API para atribuir pontos de vídeo", { videoId, userId, error });
    throw error; 
  }
}

// Outras funções relacionadas a pontos podem ser adicionadas aqui no futuro
// Ex: getUserPoints, getLeaderboard, etc. 