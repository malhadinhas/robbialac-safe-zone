
import { Video } from "@/types";
import { getCollection } from "./database";
import { generateSignedUrl } from "./cloudflareR2Service";

// Removi todas as referências a mockVideos

export async function getVideos(): Promise<Video[]> {
  try {
    const collection = await getCollection<Video>("videos");
    const videos = await collection.find({}).toArray();
    console.log(`Recuperados ${videos.length} vídeos do MongoDB Atlas`);
    return videos.map(video => ({
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
    const collection = await getCollection<Video>("videos");
    const video = await collection.findOne({ id });
    
    if (video) {
      return {
        ...video,
        uploadDate: new Date(video.uploadDate)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar vídeo por ID:", error);
    throw error;
  }
}

export async function incrementVideoViews(id: string): Promise<void> {
  try {
    const collection = await getCollection<Video>("videos");
    await collection.updateOne(
      { id },
      { $inc: { views: 1 } }
    );
    console.log(`Visualizações incrementadas para o vídeo ID: ${id}`);
  } catch (error) {
    console.error("Erro ao incrementar visualizações do vídeo:", error);
  }
}

export async function getLastViewedVideosByCategory(category: string, limit: number = 5): Promise<Video[]> {
  try {
    const collection = await getCollection<Video>("videos");
    const videos = await collection
      .find({ category: category as any })
      .sort({ views: -1 })
      .limit(limit)
      .toArray();
    
    console.log(`Recuperados ${videos.length} vídeos mais visualizados da categoria ${category}`);
    return videos.map(video => ({
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
    const collection = await getCollection<Video>("videos");
    
    // Tenta encontrar um vídeo não assistido na categoria
    let query: any = { category: category as any };
    if (viewedVideoIds.length > 0) {
      query.id = { $nin: viewedVideoIds };
    }
    
    let video = await collection.findOne(query);
    
    // Se não encontrar um vídeo não assistido, retorna qualquer vídeo da categoria
    if (!video) {
      video = await collection.findOne({ category: category as any });
    }
    
    if (video) {
      return {
        ...video,
        uploadDate: new Date(video.uploadDate)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar próximo vídeo para assistir:", error);
    throw error;
  }
}

export async function createVideo(video: Omit<Video, "id" | "uploadDate" | "views">): Promise<Video> {
  try {
    const collection = await getCollection<Video>("videos");
    const newVideo: Video = {
      ...video,
      id: crypto.randomUUID(),
      uploadDate: new Date(),
      views: 0
    };
    
    await collection.insertOne(newVideo);
    console.log(`Novo vídeo criado com ID: ${newVideo.id}`);
    return newVideo;
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
    const signedUrl = await generateSignedUrl(videoId, 120); // URL válida por 2 horas
    return signedUrl;
  } catch (error) {
    console.error("Erro ao obter URL de streaming para o vídeo:", error);
    throw new Error("Não foi possível obter a URL do vídeo");
  }
}
