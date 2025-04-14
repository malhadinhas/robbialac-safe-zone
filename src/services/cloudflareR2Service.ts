import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Video } from "@/types";
import { getR2Config } from "@/config/storage";

const getR2Client = () => {
  const config = getR2Config();
  console.log('Configuração R2:', {
    accountId: config.accountId,
    bucketName: config.bucketName,
    publicUrl: config.publicUrl
  });
  
  return new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
};

export const generateSignedUrl = async (key: string): Promise<string> => {
  try {
    const config = getR2Config();
    const client = getR2Client();
    
    // Se a key já é uma URL completa, extrair apenas o caminho
    const videoKey = key.startsWith('http') 
      ? new URL(key).pathname.slice(1) // Remove a barra inicial
      : key;
    
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: videoKey,
    });
    
    const signedUrl = await getSignedUrl(client, command, { 
      expiresIn: 3600 // URL válida por 1 hora
    });
    
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw new Error("Não foi possível gerar a URL do vídeo");
  }
};

export const prepareVideoUpload = async (fileName: string): Promise<{ uploadUrl: string; key: string }> => {
  try {
    const config = getR2Config();
    const key = `videos/${Date.now()}-${fileName}`;
    const client = getR2Client();
    
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      ContentType: 'video/mp4', // Definir o tipo de conteúdo apropriado
    });
    
    const uploadUrl = await getSignedUrl(client, command, { 
      expiresIn: 3600 // URL válida por 1 hora
    });
    
    return { 
      uploadUrl, 
      key: `${config.publicUrl}/${key}` // Retorna a URL completa
    };
  } catch (error) {
    console.error("Erro ao preparar upload do vídeo:", error);
    throw new Error("Não foi possível preparar o upload do vídeo");
  }
};

export const completeVideoUpload = async (videoData: Partial<Video>): Promise<Video> => {
  try {
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      throw new Error("Erro ao salvar metadados do vídeo");
    }

    const video = await response.json();
    return video;
  } catch (error) {
    console.error("Erro ao completar upload do vídeo:", error);
    throw new Error("Não foi possível completar o upload do vídeo");
  }
};
