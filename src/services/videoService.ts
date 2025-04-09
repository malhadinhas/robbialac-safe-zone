import { Video } from "@/types";
import { getCollection, initializeMockCollection } from "./database";
import { mockVideos } from "./mockData";

export async function getVideos(): Promise<Video[]> {
  try {
    await initializeMockCollection("videos", mockVideos);
    
    const collection = await getCollection("videos");
    const count = await collection.countDocuments();
    
    if (count === 0) {
      console.log("Inicializando coleção de vídeos com dados mockados");
      await collection.insertMany(mockVideos);
    }
    
    const videos = await collection.find<Video>({}).toArray();
    console.log(`Recuperados ${videos.length} vídeos do banco de dados local`);
    return videos.map(video => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    console.error("Erro ao buscar vídeos:", error);
    return mockVideos;
  }
}

export async function getVideoById(id: string): Promise<Video | null> {
  try {
    const collection = await getCollection("videos");
    const video = await collection.findOne<Video>({ id });
    
    if (video) {
      return {
        ...video,
        uploadDate: new Date(video.uploadDate)
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar vídeo por ID:", error);
    return mockVideos.find(v => v.id === id) || null;
  }
}

export async function incrementVideoViews(id: string): Promise<void> {
  try {
    const collection = await getCollection("videos");
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
    const filteredVideos = mockVideos
      .filter(video => video.category === category)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
    
    console.log(`Retrieved ${filteredVideos.length} last viewed videos for category ${category}`);
    return filteredVideos;
  } catch (error) {
    console.error("Error getting last viewed videos by category:", error);
    return [];
  }
}

export async function getNextVideoToWatch(category: string, viewedVideoIds: string[] = []): Promise<Video | null> {
  try {
    const categoryVideos = mockVideos.filter(video => video.category === category);
    
    const unwatchedVideos = categoryVideos.filter(video => 
      viewedVideoIds.length === 0 || !viewedVideoIds.includes(video.id)
    );
    
    const recommendedVideo = unwatchedVideos.length > 0 
      ? unwatchedVideos[0] 
      : (categoryVideos.length > 0 ? categoryVideos[0] : null);
    
    return recommendedVideo;
  } catch (error) {
    console.error("Error getting next video recommendation:", error);
    return null;
  }
}
