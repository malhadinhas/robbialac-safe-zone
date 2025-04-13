import { Video } from "@/types";
import { generateSignedUrl } from "./cloudflareR2Service";

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
    
    console.log('Categoria original:', category);
    console.log('Chave normalizada:', normalizedKey);
    
    const mappedCategory = categoryMapping[normalizedKey];
    console.log('Categoria mapeada:', mappedCategory);
    
    if (!mappedCategory) {
      console.warn('Categoria não encontrada no mapeamento:', category);
      return category;
    }
    
    return mappedCategory;
  } catch (error) {
    console.error('Erro ao normalizar categoria:', error);
    return category;
  }
}

export async function getVideos(): Promise<Video[]> {
  try {
    const response = await fetch('/api/videos');
    if (!response.ok) {
      throw new Error('Erro ao buscar vídeos');
    }
    const videos = await response.json();
    console.log(`Recuperados ${videos.length} vídeos`);
    return videos.map((video: Video) => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    console.error("Erro ao buscar vídeos:", error);
    throw error;
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  try {
    const response = await fetch(`/api/videos/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Erro ao buscar vídeo');
    }
    const video = await response.json();
    return {
      ...video,
      uploadDate: new Date(video.uploadDate)
    };
  } catch (error) {
    console.error("Erro ao buscar vídeo por ID:", error);
    throw error;
  }
}

export async function incrementVideoViews(id: string): Promise<void> {
  try {
    const response = await fetch(`/api/videos/${id}/views`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erro ao incrementar visualizações');
    }
    console.log(`Visualizações incrementadas para o vídeo ID: ${id}`);
  } catch (error) {
    console.error("Erro ao incrementar visualizações do vídeo:", error);
    throw error;
  }
}

export async function getLastViewedVideosByCategory(category: string, limit: number = 5): Promise<Video[]> {
  try {
    // Normaliza a categoria antes de fazer a chamada
    const normalizedCategory = normalizeCategory(category);
    const encodedCategory = encodeURIComponent(normalizedCategory);
    
    console.log('Buscando vídeos para categoria:', {
      original: category,
      normalized: normalizedCategory,
      encoded: encodedCategory
    });
    
    const response = await fetch(`/api/videos/category/${encodedCategory}/most-viewed?limit=${limit}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error(`Erro ao buscar vídeos por categoria: ${response.status} ${response.statusText}`);
    }
    
    const videos = await response.json();
    console.log(`Recuperados ${videos.length} vídeos mais visualizados da categoria ${category}`);
    return videos.map((video: Video) => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    console.error("Erro ao buscar vídeos mais visualizados por categoria:", error);
    throw error;
  }
}

export async function getNextVideoToWatch(category: string, viewedVideoIds: string[] = []): Promise<Video | null> {
  try {
    const response = await fetch(`/api/videos/category/${category}/next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ viewedVideoIds })
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Erro ao buscar próximo vídeo');
    }
    const video = await response.json();
    return {
      ...video,
      uploadDate: new Date(video.uploadDate)
    };
  } catch (error) {
    console.error("Erro ao buscar próximo vídeo para assistir:", error);
    throw error;
  }
}

export async function createVideo(video: Omit<Video, "id" | "uploadDate" | "views">): Promise<Video> {
  try {
    // Primeiro, verifica se já existe um vídeo com o mesmo título
    const videos = await getVideos();
    const existingVideo = videos.find(v => 
      v.title.toLowerCase() === video.title.toLowerCase() ||
      v.url === video.url
    );

    if (existingVideo) {
      const errorMessage = existingVideo.title.toLowerCase() === video.title.toLowerCase()
        ? `Já existe um vídeo com o título "${video.title}"`
        : `Já existe um vídeo com a URL fornecida`;
      
      throw new Error(errorMessage);
    }

    const response = await fetch('/api/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(video)
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.existingVideo) {
        throw new Error(errorData.message);
      }
      throw new Error('Erro ao criar vídeo: ' + (errorData.details || errorData.message || 'Erro desconhecido'));
    }

    const newVideo = await response.json();
    console.log(`Novo vídeo criado com ID: ${newVideo.id}`);
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
    const signedUrl = await generateSignedUrl(videoId);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao obter URL de streaming para o vídeo:", error);
    throw new Error("Não foi possível obter a URL do vídeo");
  }
}
