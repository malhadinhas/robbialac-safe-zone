import api from '../lib/api'; // Corrected import path and name

// --- Interfaces based on backend analysis ---
// (Could be shared in a types directory later)

export interface RecentQA {
  _id: string;
  title: string;
  date: string; // ISO Date string from MongoDB
}

export interface RecentDocument {
  _id: string;
  name: string; // 'name' field used in Accident and Sensibilizacao models
  createdAt: string; // ISO Date string from Mongoose timestamps
  type: 'Acidente' | 'Sensibilizacao'; // Added by the backend endpoint
}

// --- Nova Interface Unificada para Itens do Feed ---
export interface FeedItem {
  _id: string;
  type: 'qa' | 'document'; // Tipo de item
  title: string; // Usaremos title para QA, name para Document
  date: string; // Usaremos date para QA, createdAt para Document (Backend deve unificar)
  // Campos opcionais que o backend pode adicionar para navegação/exibição
  documentType?: 'Acidente' | 'Sensibilizacao'; 
  likeCount?: number; // Opcional: Contagem de Likes
  commentCount?: number; // Opcional: Contagem de Comentários
}


// --- API Service Functions ---

// const API_BASE = '/api'; // This might not be needed if the base URL is set in api.ts

/**
 * Fetches the unified feed activity stream.
 * Corrected endpoint to match server.ts mounting: /api/activities/feed
 * @param limit Max number of items to fetch (defaults to 10).
 */
export const getFeedActivity = async (limit: number = 10): Promise<FeedItem[]> => {
  try {
    // Corrected URL: /activities/feed (plural)
    const response = await api.get<FeedItem[]>(`/activities/feed`, { 
      params: { limit }
    });
    // Assume que o backend já retorna os dados ordenados e formatados como FeedItem
    return response.data;
  } catch (error) {
    console.error('Error fetching feed activity:', error);
    throw error; // Re-throw para ser tratado no componente
  }
}; 