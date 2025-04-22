import { toast } from 'sonner';
import api from '../lib/api'; // <<< IMPORTAR a instância api configurada

// Helper para obter o token (REMOVIDO)
// const getAuthToken = (): string | null => { ... };

// Helper para fazer chamadas fetch (REMOVIDO)
// const fetchApi = async (url: string, options: RequestInit = {}) => { ... };

// --- Funções de Interação UNIFICADAS (Usando a instância api) ---

type ItemType = 'qa' | 'accident' | 'sensibilizacao';

/**
 * Adiciona um like a um item.
 */
export const addInteractionLike = async (itemId: string, itemType: ItemType): Promise<void> => {
  if (!itemId || !itemType) throw new Error('ID do item e tipo são necessários para dar like.');
  try {
    await api.post(`/interactions/like`, { itemId, itemType });
    // Não esperamos corpo na resposta de sucesso (200 OK)
  } catch (error: any) { // Adicionar tratamento de erro específico
    console.error('Erro ao adicionar like via API:', error);
    toast.error(error?.response?.data?.message || error.message || 'Erro ao adicionar like.');
    throw error;
  }
};

/**
 * Remove um like de um item.
 */
export const removeInteractionLike = async (itemId: string, itemType: ItemType): Promise<void> => {
  if (!itemId || !itemType) throw new Error('ID do item e tipo são necessários para remover like.');
  try {
    // Usar config data para DELETE com body em axios
    await api.delete(`/interactions/like`, { 
        data: { itemId, itemType } 
    });
   // Não esperamos corpo na resposta de sucesso (200 OK ou 204 No Content)
  } catch (error: any) { // Adicionar tratamento de erro específico
    console.error('Erro ao remover like via API:', error);
    toast.error(error?.response?.data?.message || error.message || 'Erro ao remover like.');
    throw error;
  }
};

/**
 * Adiciona um comentário a um item.
 */
export const addInteractionComment = async (
    itemId: string,
    itemType: ItemType,
    text: string
): Promise<{ _id: string; user: { _id: string, name: string }; text: string; createdAt: Date }> => {
  if (!itemId || !itemType || !text) throw new Error('ID do item, tipo e texto são necessários para comentar.');
  try {
    const response = await api.post(`/interactions/comment`, { itemId, itemType, text });
    const commentData = response.data;
    
    // Validação básica da resposta esperada
    if (!commentData?._id || !commentData?.user?._id || !commentData?.text) {
        console.error('Resposta inesperada do addInteractionComment:', commentData);
        throw new Error('Resposta inválida do servidor ao adicionar comentário.');
    }
    // Converte createdAt para Date se vier como string
    if (commentData.createdAt && typeof commentData.createdAt === 'string') {
        commentData.createdAt = new Date(commentData.createdAt);
    }
    return commentData as { _id: string; user: { _id: string, name: string }; text: string; createdAt: Date };
  } catch (error: any) { // Adicionar tratamento de erro específico
    console.error('Erro ao adicionar comentário via API:', error);
    toast.error(error?.response?.data?.message || error.message || 'Erro ao adicionar comentário.');
    throw error;
  }
};

// --- Funções Específicas (Adaptadas) ---

/**
 * Dá ou tira like a um documento de sensibilização.
 * @param sensibilizacaoId ID do documento.
 * @param currentLiked Estado atual (se o user já deu like).
 */
export const toggleSensibilizacaoLike = async (sensibilizacaoId: string, currentLiked: boolean): Promise<void> => {
  if (!sensibilizacaoId) throw new Error('ID do documento é necessário.');
  const itemType: ItemType = 'sensibilizacao';

  if (currentLiked) {
    // Se já deu like, remover
    await removeInteractionLike(sensibilizacaoId, itemType);
  } else {
    // Se não deu like, adicionar
    await addInteractionLike(sensibilizacaoId, itemType);
  }
  // A função agora não retorna o estado, o componente deve gerir isso otimisticamente
  // e reverter em caso de erro.
};

/**
 * Adiciona um comentário a um documento de sensibilização.
 * @param sensibilizacaoId ID do documento.
 * @param text Texto do comentário.
 * @returns Promise com o comentário criado.
 */
export const addSensibilizacaoComment = async (
    sensibilizacaoId: string,
    text: string
): Promise<{ _id: string; user: { _id: string, name: string }; text: string; createdAt: Date }> => {
  return addInteractionComment(sensibilizacaoId, 'sensibilizacao', text);
};

// --- Funções Antigas (Manter por agora ou remover/adaptar depois) ---

/**
 * Envia um pedido para dar/tirar like a um acidente. (DESATUALIZADO)
 */
export const toggleLike = async (accidentId: string): Promise<{ liked: boolean; likeCount: number }> => {
  if (!accidentId) throw new Error('ID do acidente é necessário para dar like.');
  const response = await api.post(`/acidentes/${accidentId}/like`);
  // Assumindo que a resposta contém { liked: boolean, likeCount: number }
  if (typeof response?.liked !== 'boolean' || typeof response?.likeCount !== 'number') {
      console.error('Resposta inesperada do toggleLike:', response);
      throw new Error('Resposta inválida do servidor ao dar like.');
  }
  return response as { liked: boolean; likeCount: number };
};

/**
 * Adiciona um comentário a um acidente. (DESATUALIZADO)
 */
export const addComment = async (
    accidentId: string,
    text: string
): Promise<{ _id: string; user: { _id: string, name: string }; text: string; createdAt: Date }> => {
  if (!accidentId || !text) throw new Error('ID do acidente e texto são necessários para comentar.');
  const response = await api.post(`/acidentes/${accidentId}/comments`, { text });
   // Validação básica da resposta esperada
   if (!response?._id || !response?.user?._id || !response?.text) {
       console.error('Resposta inesperada do addComment:', response);
       throw new Error('Resposta inválida do servidor ao adicionar comentário.');
   }
   // Converte createdAt para Date se vier como string
   if (response.createdAt && typeof response.createdAt === 'string') {
       response.createdAt = new Date(response.createdAt);
   }
  return response as { _id: string; user: { _id: string, name: string }; text: string; createdAt: Date };
};

// (Opcional) Função para buscar comentários separadamente para sensibilizacao (USARÁ GET /api/interactions/comments/:itemType/:itemId)
// export const getSensibilizacaoComments = async (sensibilizacaoId: string): Promise<any[]> => {
//   const response = await api.get(`/sensibilizacao/${sensibilizacaoId}/comments`);
//   return response.data;
// };