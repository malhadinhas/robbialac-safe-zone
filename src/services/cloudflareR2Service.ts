
import { getR2Config, defaultTranscodingConfig } from "../config/storage";
import { Video } from "@/types";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Função para obter um cliente S3 configurado para o Cloudflare R2
function getR2Client(): S3Client {
  const config = getR2Config();
  
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

/**
 * Gera uma URL assinada para acesso temporário ao vídeo
 */
export async function generateSignedUrl(videoId: string, expirationMinutes: number = 60): Promise<string> {
  try {
    const r2Config = getR2Config();
    const client = getR2Client();
    
    // Cria um comando para obter o objeto (vídeo)
    const command = new GetObjectCommand({
      Bucket: r2Config.bucketName,
      Key: `videos/${videoId}/index.m3u8`,
    });
    
    // Gera a URL assinada com o tempo de expiração
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: expirationMinutes * 60, // Converter minutos para segundos
    });
    
    console.log(`URL assinada gerada para o vídeo ${videoId}, expira em ${expirationMinutes} minutos`);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw new Error("Falha ao gerar URL de acesso ao vídeo");
  }
}

/**
 * Prepara um vídeo para upload para R2
 */
export async function prepareVideoUpload(videoFile: File, metadata: Omit<Video, "id" | "url" | "thumbnail" | "uploadDate" | "views">): Promise<{ 
  uploadUrl: string;
  videoId: string;
}> {
  try {
    const videoId = `video_${Date.now()}`;
    const r2Config = getR2Config();
    const client = getR2Client();
    
    console.log(`Preparando upload para vídeo: ${metadata.title}`);
    
    // Gera uma URL pré-assinada para upload direto
    const command = new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: `videos/${videoId}/original.mp4`,
      ContentType: videoFile.type,
    });
    
    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: 3600, // URL válida por 1 hora
    });
    
    return {
      uploadUrl,
      videoId
    };
  } catch (error) {
    console.error("Erro ao preparar upload:", error);
    throw new Error("Falha ao preparar upload do vídeo");
  }
}

/**
 * Completa o processo de upload, depois que o arquivo foi carregado para R2
 */
export async function completeVideoUpload(videoId: string, metadata: Partial<Video>): Promise<Video> {
  // Na implementação real, aqui seria iniciado o processo de transcodificação do vídeo
  // Para HLS e geração de miniaturas, provavelmente via um webhook ou função serverless
  
  const r2Config = getR2Config();
  const baseUrl = r2Config.publicUrl;
  const thumbnailUrl = `${baseUrl}/videos/${videoId}/thumbnail.jpg`;
  
  const newVideo: Video = {
    id: videoId,
    title: metadata.title || "Vídeo sem título",
    description: metadata.description || "",
    url: `${baseUrl}/videos/${videoId}/index.m3u8`,
    thumbnail: thumbnailUrl,
    duration: metadata.duration || 0,
    category: metadata.category as any || "Segurança",
    zone: metadata.zone as any || "Enchimento",
    uploadDate: new Date(),
    views: 0,
    pointsForWatching: metadata.pointsForWatching || 10
  };
  
  // Aqui seria implementada a lógica para salvar os metadados no MongoDB
  try {
    const { getCollection } = await import('./database');
    const collection = await getCollection("videos");
    await collection.insertOne(newVideo);
    console.log("Vídeo processado e salvo no banco de dados:", videoId);
  } catch (error) {
    console.error("Erro ao salvar metadados do vídeo:", error);
    throw new Error("Falha ao processar o vídeo após upload");
  }
  
  return newVideo;
}
