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
    console.log('Gerando URL assinada para chave:', key);
    const config = getR2Config();
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    const signedUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log('URL assinada gerada com sucesso:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw error;
  }
};

export const prepareVideoUpload = async (fileName: string): Promise<{ uploadUrl: string; key: string }> => {
  try {
    console.log('Preparando upload para arquivo:', fileName);
    const config = getR2Config();
    const key = `videos/${Date.now()}-${fileName}`;
    const client = getR2Client();
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
    console.log('URL de upload gerada:', { key, uploadUrl });
    return { uploadUrl, key };
  } catch (error) {
    console.error("Erro ao preparar upload do vídeo:", error);
    throw error;
  }
};

export const completeVideoUpload = async (videoData: Partial<Video>): Promise<Video> => {
  try {
    console.log('Completando upload do vídeo:', videoData);
    const response = await fetch("/api/videos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(videoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        data: errorData
      });
      throw new Error("Erro ao salvar metadados do vídeo");
    }

    const video = await response.json();
    console.log('Vídeo salvo com sucesso:', video);
    return video;
  } catch (error) {
    console.error("Erro ao completar upload do vídeo:", error);
    throw error;
  }
};
