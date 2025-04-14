import { Video } from "@/types";
import { generateSignedUrl } from "./cloudflareR2Service";
import axios, { AxiosError } from 'axios';
import logger from '../utils/logger';

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
    
    logger.debug('Normalizando categoria', {
      original: category,
      normalized: normalizedKey
    });
    
    const mappedCategory = categoryMapping[normalizedKey];
    
    if (!mappedCategory) {
      logger.warn('Categoria não encontrada no mapeamento', { category });
      return category;
    }
    
    return mappedCategory;
  } catch (error) {
    logger.error('Erro ao normalizar categoria', { error, category });
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
      logger.error('Tipo de arquivo não permitido', {
        type: file.type,
        name: file.name
      });
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
    
    logger.info('Preparando upload de arquivo', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    formData.append('video', file, file.name);
    formData.append('title', metadata.title.trim());
    formData.append('description', metadata.description.trim());
    formData.append('category', normalizeCategory(metadata.category));
    formData.append('zone', metadata.zone);

    logger.info('Iniciando upload de vídeo', {
      fileName: file.name,
      fileSize: file.size,
      metadata,
      retryCount
    });

    const response = await axios.post(`${API_URL}/api/videos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: UPLOAD_TIMEOUT,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          progress.loaded = progressEvent.loaded;
          progress.total = progressEvent.total;
          progress.percentage = percentage;
          progress.status = 'uploading';
          onProgress?.(progress);
        }
      }
    });

    logger.info('Upload concluído com sucesso', {
      videoId: response.data.id,
      response: response.data
    });

    progress.status = 'completed';
    progress.percentage = 100;
    onProgress?.(progress);

    return {
      success: true,
      videoId: response.data.id
    };

  } catch (error) {
    logger.error('Erro no upload do vídeo', { 
      error,
      metadata,
      retryCount,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    
    // Tentar novamente em caso de erro de conexão
    if (error instanceof AxiosError && 
        (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') && 
        retryCount < MAX_RETRIES) {
      logger.info('Tentando upload novamente após erro de conexão', {
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES
      });
      
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

// Função para buscar vídeos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const response = await axios.get(`${API_URL}/api/videos`);
    
    // Garantir que a resposta é um array
    const videos = Array.isArray(response.data) ? response.data : [];
    
    if (!Array.isArray(response.data)) {
      logger.warn('API retornou dados em formato inesperado', { 
        received: typeof response.data,
        data: response.data 
      });
    }

    // Mapear e validar cada vídeo
    return videos.map((video: any) => ({
      id: video.id || '',
      title: video.title || '',
      description: video.description || '',
      url: video.url || '',
      thumbnail: video.thumbnail || '',
      category: normalizeCategory(video.category || ''),
      zone: video.zone || '',
      views: typeof video.views === 'number' ? video.views : 0,
      uploadDate: new Date(video.uploadDate || Date.now()),
      duration: video.duration || 0
    }));
  } catch (error) {
    logger.error('Erro ao buscar vídeos', { 
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    return []; // Retorna array vazio em caso de erro
  }
};

// Função para buscar um vídeo específico
export const getVideoById = async (videoId: string) => {
  try {
    const response = await axios.get(`${API_URL}/api/videos/${videoId}`);
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar vídeo por ID', { error, videoId });
    throw error;
  }
};

// Função para incrementar visualizações
export const incrementVideoViews = async (videoId: string) => {
  try {
    await axios.post(`${API_URL}/api/videos/${videoId}/views`);
  } catch (error) {
    logger.error('Erro ao incrementar visualizações', { error, videoId });
    throw error;
  }
};

export async function getLastViewedVideosByCategory(category: string, limit: number = 5): Promise<Video[]> {
  try {
    const normalizedCategory = encodeURIComponent(category);
    const response = await axios.get(
      `${API_URL}/api/videos/category/${normalizedCategory}/most-viewed?limit=${limit}`
    );
    return response.data.map((video: Video) => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    logger.error('Erro ao buscar vídeos por categoria', { error, category, limit });
    return [];
  }
}

export async function getNextVideoToWatch(category: string, viewedVideoIds: string[] = []): Promise<Video | null> {
  try {
    const response = await axios.post(`${API_URL}/api/videos/category/${category}/next`, {
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
    logger.error('Erro ao buscar próximo vídeo', { error, category });
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
    const response = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...video,
        title: video.title.trim(), // Garantir que não há espaços extras
        url: video.url.trim()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao criar vídeo');
    }

    const newVideo = await response.json();
    return {
      ...newVideo,
      uploadDate: new Date(newVideo.uploadDate)
    };
  } catch (error) {
    console.error("Erro ao criar vídeo:", error);
    throw error;
  }
}

/**
 * Obtém uma URL assinada para visualização do vídeo
 */
export async function getVideoStreamUrl(videoId: string): Promise<string> {
  try {
    const video = await getVideoById(videoId);
    if (!video) throw new Error('Vídeo não encontrado');
    
    // Gerar URL assinada do Cloudflare R2
    const signedUrl = await generateSignedUrl(video.url);
    return signedUrl;
  } catch (error) {
    console.error('Erro ao obter URL do vídeo:', error);
    throw error;
  }
}
