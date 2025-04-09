
import { Video } from "@/types";
import { getCollection, initializeMockCollection } from "./database";
import { mockVideos } from "./mockData";

export async function getVideos(): Promise<Video[]> {
  try {
    // Inicializa a coleção com dados mockados se estiver vazia
    await initializeMockCollection("videos", mockVideos);
    
    const collection = await getCollection("videos");
    const count = await collection.countDocuments();
    
    // Se não houver documentos, inicializa com os dados mockados
    if (count === 0) {
      console.log("Inicializando coleção de vídeos com dados mockados");
      await collection.insertMany(mockVideos);
    }
    
    const videos = await collection.find<Video>({}).toArray();
    return videos.map(video => ({
      ...video,
      uploadDate: new Date(video.uploadDate)
    }));
  } catch (error) {
    console.error("Erro ao buscar vídeos:", error);
    // Em caso de erro, retorna os dados mockados
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
    // Em caso de erro, retorna o vídeo dos dados mockados
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
  } catch (error) {
    console.error("Erro ao incrementar visualizações do vídeo:", error);
  }
}
