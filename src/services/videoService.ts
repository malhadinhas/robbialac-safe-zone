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
      if (response.status === 404) return null;
      throw new Error('Erro ao buscar vídeo');
    }
    const video = await response.json();
    return {
      ...video,
      uploadDate: new Date(video.uploadDate)
    };
  } catch (error) {
    console.error("Erro ao buscar vídeo:", error);
    throw error;
  }
}

export async function incrementVideoViews(videoId: string): Promise<void> {
  try {
    const response = await fetch(`/api/videos/${videoId}/views`, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Erro ao incrementar visualizações');
    }
  } catch (error) {
    console.error("Erro ao incrementar visualizações:", error);
    throw error;
  }
}

export async function getLastViewedVideosByCategory(category: string, limit: number = 5): Promise<Video[]> {
  try {
    const normalizedCategory = encodeURIComponent(category);
    const response = await fetch(`/api/videos/category/${normalizedCategory}/most-viewed?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar vídeos por categoria: ${response.status}`);
    }
    
    const videos = await response.json();
    return videos.map((video: Video) => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    console.error("Erro ao buscar vídeos por categoria:", error);
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
    console.error("Erro ao obter URL do vídeo:", error);
    throw error;
  }
}
