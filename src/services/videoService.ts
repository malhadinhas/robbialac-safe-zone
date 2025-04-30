import { Video } from "@/types";
// Remover importação direta do axios
// import axios, { AxiosError } from 'axios';
// Importar a instância configurada
import api from '@/lib/api';
import { AxiosError } from 'axios'; // Manter para tipagem de erro

// Removi todas as referências a mockVideos

// Mapeamento de categorias para o formato do banco de dados
const categoryMapping: Record<string, string> = {
  'seguranca': 'Segurança',
  'segurança': 'Segurança',
  'treinamento': 'Treinamento',
  'procedimentos': 'Procedimentos',
  'procedimentos e regras': 'Procedimentos',
  'equipamentos': 'Equipamentos',
  'outros': 'Outros'
};

// Normaliza a categoria para o formato do banco de dados
function normalizeCategory(category: string): string {
  try {
    const normalizedKey = category
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    
    const mappedCategory = categoryMapping[normalizedKey];
    
    if (!mappedCategory) {
      return category;
    }
    
    return mappedCategory;
  } catch (error) {
    return category;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const UPLOAD_TIMEOUT = 30 * 60 * 1000; // 30 minutos
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error';
  currentChunk: number;
  totalChunks: number;
}

interface VideoMetadata {
  title: string;
  description: string;
  category: string;
  zone: string;
  thumbnail?: File;
}

export const uploadVideo = async (
  file: File,
  metadata: VideoMetadata,
  onProgress?: (progress: UploadProgress) => void,
  retryCount = 0
): Promise<{ success: boolean; videoId?: string; error?: string }> => {
  try {
    // Validações iniciais
    if (!file) {
      throw new Error('Nenhum arquivo selecionado');
    }

    // Validar tipo do arquivo
    const allowedMimeTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];

    if (!allowedMimeTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não permitido. Use apenas MP4, MOV, AVI ou MKV. Tipo detectado: ${file.type}`);
    }

    if (!metadata.title || !metadata.description || !metadata.category || !metadata.zone) {
      throw new Error('Informações do vídeo incompletas');
    }

    // Inicializar progresso
    const progress: UploadProgress = {
      loaded: 0,
      total: file.size,
      percentage: 0,
      status: 'preparing',
      currentChunk: 0,
      totalChunks: 1
    };

    onProgress?.(progress);

    // Iniciar upload
    const formData = new FormData();
    
    // Adicionar os campos ao FormData corretamente
    formData.append('video', file);
    formData.append('title', metadata.title.trim());
    formData.append('description', metadata.description.trim());
    formData.append('category', normalizeCategory(metadata.category));
    formData.append('zone', metadata.zone);

    progress.status = 'uploading';
    onProgress?.(progress);

    const response = await api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progress.loaded = progressEvent.loaded;
          progress.total = progressEvent.total;
          progress.percentage = percentage;
          progress.status = 'uploading';
          progress.currentChunk = 1;
          progress.totalChunks = 1;
          onProgress?.(progress);
        }
      }
    });

    return {
      success: true,
      videoId: response.data.videoId
    };

  } catch (error) {
    // Tentar novamente em caso de erro de conexão
    if (error instanceof AxiosError && 
        (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && 
        retryCount < MAX_RETRIES) {
      // Esperar antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
      
      return uploadVideo(file, metadata, onProgress, retryCount + 1);
    }
    
    let errorMessage = 'Erro ao enviar o vídeo';
    
    if (error instanceof AxiosError) {
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Erro de conexão com o servidor. Verifique sua internet e tente novamente.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Endpoint de upload não encontrado. Verifique a configuração do servidor.';
      } else if (error.response?.status === 413) {
        errorMessage = 'O arquivo é muito grande. Tamanho máximo permitido é 500MB.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'O upload demorou muito tempo. Tente novamente.';
      } else {
        errorMessage = error.response?.data?.message || 'Erro na comunicação com o servidor';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

// Interface para a resposta da nova API de URL segura
interface SecureUrlResponse {
  signedUrl: string;
}

// --- Função para buscar a URL segura do backend --- 
export const getSecureR2Url = async (key: string): Promise<string> => {
  // --- REMOVER LOG TEMPORÁRIO ---
  // console.warn(`[videoService] getSecureR2Url chamada para key: ${key}`);
  
  if (!key) {
    throw new Error('Chave R2 inválida ou não fornecida para URL segura');
  }
  try {
    const response = await api.get('/secure-url', {
      params: { key },
      timeout: 15000,
    });
    if (response.data?.url) {
      return response.data.url;
    } 
    else if (response.data?.signedUrl) {
      return response.data.signedUrl;
    } 
    else {
      throw new Error('Resposta da API não contém URL válida');
    }
  } catch (error) {
    // --- REMOVER LOG TEMPORÁRIO ---
    // console.error(`[videoService] !!! Erro em getSecureR2Url para key: ${key}`, error);
    
    // Lança o erro novamente para que o chamador (VideoThumbnail) possa pegá-lo
    if (error instanceof Error) {
      throw new Error(`Erro ao buscar URL segura: ${error.message}`);
    } else {
      throw new Error('Erro desconhecido ao buscar URL segura');
    }
  }
};

// Função para buscar vídeos (RETORNA CHAVES R2 AGORA)
export const getVideos = async (options?: { category?: string; limit?: string }): Promise<Video[]> => {
  try {
    const response = await api.get('/videos', { params: options });
    
    const videos = Array.isArray(response.data) ? response.data : [];
    
    if (!Array.isArray(response.data)) {
      return []; 
    }

    // Mapear dados (assegurando que têm ID e status)
    let mappedVideos = videos.map((video: any) => ({
      id: video.id || video._id || '', 
      title: video.title || '',
      description: video.description || '',
      r2VideoKey: video.r2VideoKey || video.r2Key || '',
      r2ThumbnailKey: video.r2ThumbnailKey || '',
      category: normalizeCategory(video.category || ''),
      zone: video.zone || '',
      views: typeof video.views === 'number' ? video.views : 0,
      uploadDate: new Date(video.uploadDate || Date.now()),
      duration: video.duration || 0,
      status: video.status || 'unknown',
      r2Qualities: video.r2Qualities || { high: '', medium: '', low: '' },
      videoId: video.videoId
    }));

    // Filtrar por categoria se fornecida
    if (options?.category) {
      const normalizedCategory = normalizeCategory(options.category);
      mappedVideos = mappedVideos.filter(v => v.category === normalizedCategory);
    }

    // Limitar número de resultados se fornecido
    if (options?.limit) {
      const limit = parseInt(options.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        mappedVideos = mappedVideos.slice(0, limit);
      }
    }

    return mappedVideos;

  } catch (error) {
    return []; 
  }
};

// Função para buscar um vídeo por ID (RETORNA CHAVES R2 AGORA)
export const getVideoById = async (videoId: string): Promise<Video | null> => {
  if (!videoId) return null;
  try {
    const response = await api.get('/videos/' + videoId);
    // Aqui também precisamos mapear para garantir o formato esperado pelo tipo Video
    const videoData = response.data;
    if (!videoData) return null;

    return {
       id: videoData._id || videoData.id || '', // Garantir que ID existe
       title: videoData.title || '',
       description: videoData.description || '',
       r2VideoKey: videoData.r2VideoKey || '',
       r2ThumbnailKey: videoData.r2ThumbnailKey || '',
       category: normalizeCategory(videoData.category || ''),
       zone: videoData.zone || '',
       views: typeof videoData.views === 'number' ? videoData.views : 0,
       uploadDate: new Date(videoData.uploadDate || Date.now()),
       duration: videoData.duration || 0,
       status: videoData.status || 'unknown',
       r2Qualities: videoData.r2Qualities || { high: '', medium: '', low: '' }
    };

  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null; // Vídeo não encontrado
    }
    throw error; // Relançar outros erros
  }
};

// Função para incrementar visualizações
export const incrementVideoViews = async (videoId: string) => {
  try {
    await api.post('/videos/' + videoId + '/views');
  } catch (error) {
    throw error;
  }
};

export async function getLastViewedVideosByCategory(category: string, limit: number = 5): Promise<Video[]> {
  try {
    const normalizedCategory = encodeURIComponent(category);
    const response = await api.get('/videos/category/' + normalizedCategory + '/most-viewed?limit=' + limit);
    return response.data.map((video: Video) => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    return [];
  }
}

export async function getNextVideoToWatch(category: string, viewedVideoIds: string[] = []): Promise<Video | null> {
  try {
    const response = await api.post('/videos/category/' + category + '/next', {
      viewedVideoIds
    });
    
    if (response.data) {
      return {
        ...response.data,
        uploadDate: new Date(response.data.uploadDate)
      };
    }
    return null;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createVideo(video: Omit<Video, "id" | "uploadDate" | "views">): Promise<Video> {
  try {
    // Normalizar o título para comparação
    const normalizedTitle = video.title.toLowerCase().trim();
    const normalizedUrl = video.url.trim();

    // Primeiro, verifica se já existe um vídeo com o mesmo título ou URL
    const videos = await getVideos();
    
    // Verificar título duplicado (ignorando case e espaços)
    const existingVideoByTitle = videos.find(v => 
      v.title.toLowerCase().trim() === normalizedTitle
    );

    if (existingVideoByTitle) {
      throw new Error(`Já existe um vídeo com o título "${video.title}"`);
    }

    // Verificar URL duplicada
    const existingVideoByUrl = videos.find(v => 
      v.url.trim() === normalizedUrl
    );

    if (existingVideoByUrl) {
      throw new Error(`Já existe um vídeo com a URL fornecida`);
    }

    // Verificar se a categoria é válida
    const validCategories = ['Segurança', 'Qualidade', 'Procedimentos e Regras'];
    if (!validCategories.includes(video.category)) {
      throw new Error(`Categoria inválida. Deve ser uma das seguintes: ${validCategories.join(', ')}`);
    }

    // Se passou por todas as verificações, criar o vídeo
    const response = await api.post('/videos', video);
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Função para obter a URL de stream (AGORA CHAMA getSecureR2Url)
export async function getVideoStreamUrl(videoId: string): Promise<string> {
  try {
    const video = await getVideoById(videoId);
    if (!video || !video.r2VideoKey) {
      throw new Error('Vídeo ou chave R2 não encontrado para gerar URL de stream');
    }
    
    // Chamar a nova função para obter a URL segura do backend usando a chave R2 correta
    const signedUrl = await getSecureR2Url(video.r2VideoKey);
    
    return signedUrl;
  } catch (error) {
    throw error; // Relançar para a página
  }
}

// Note: Delete video might need specific handling if it doesn't return data or expects 204
export async function deleteVideo(videoId: string): Promise<void> {
  try {
    // Usar 'api.delete'
    await api.delete('/videos/' + videoId);
  } catch (error) {
    throw error;
  }
}

// Função para obter estatísticas
export async function getVideoStats(): Promise<any> {
  try {
    // Usar 'api.get'
    const response = await api.get('/videos/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
}
