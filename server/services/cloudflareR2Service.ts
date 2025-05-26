import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Video } from "../../src/types";

// Configuração do cliente R2
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
  throw new Error('Variáveis de ambiente do Cloudflare R2 não configuradas');
}

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

/**
 * Gera uma URL assinada para acesso temporário ao vídeo
 */
export async function generateSignedUrl(videoId: string, expirationMinutes: number = 60): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `videos/${videoId}/index.m3u8`,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: expirationMinutes * 60,
    });

    console.log(`URL assinada gerada para o vídeo ${videoId}, expira em ${expirationMinutes} minutos`);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada:", error);
    throw new Error("Falha ao gerar URL de acesso ao vídeo");
  }
}

/**
 * Gera uma URL assinada para upload de vídeo
 */
export async function generateUploadUrl(videoId: string, contentType: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `videos/${videoId}/original`,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 3600, // 1 hora para upload
    });

    console.log(`URL de upload gerada para o vídeo ${videoId}`);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL de upload:", error);
    throw new Error("Falha ao gerar URL para upload do vídeo");
  }
}

/**
 * Gera uma URL assinada para acesso temporário a um modelo 3D
 */
export async function generate3DModelSignedUrl(modelId: string, expirationMinutes: number = 60): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: `models/${modelId}`,
    });

    const signedUrl = await getSignedUrl(r2Client, command, {
      expiresIn: expirationMinutes * 60,
    });

    console.log(`URL assinada gerada para o modelo 3D ${modelId}, expira em ${expirationMinutes} minutos`);
    return signedUrl;
  } catch (error) {
    console.error("Erro ao gerar URL assinada para modelo 3D:", error);
    throw new Error("Falha ao gerar URL de acesso ao modelo 3D");
  }
} 