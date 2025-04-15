import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promises as fs } from 'fs';
import { storageConfig } from '../config/storage';
import logger from '../utils/logger';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// Configurações do Cloudflare R2
const R2_CONFIG = {
  endpoint: process.env.R2_ENDPOINT || 'https://485c3c736434b646ff46725121de873c.r2.cloudflarestorage.com',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '56f3925666837ff8ba99087b930e88cb',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '31352a5a4c56a50c5f05cd7cdcb1d010f6fd6a24f32c2b1560bc56a613c266cc',
  bucketName: process.env.R2_BUCKET_NAME || 'workplace-safety-videos',
  region: 'auto'
};

// Obter o tempo de expiração das URLs assinadas da configuração ou usar o padrão
const getUrlExpiration = (): number => {
  const expiration = Number(process.env.R2_URL_EXPIRATION);
  return !isNaN(expiration) ? expiration : 3600; // Padrão: 1 hora
};

export class VideoProcessor {
  private s3Client: S3Client;
  
  constructor() {
    this.s3Client = new S3Client({
      region: R2_CONFIG.region,
      endpoint: R2_CONFIG.endpoint,
      credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
      },
    });
  }

  private async ensureDirectoryExists(dir: string): Promise<void> {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  // Upload para Cloudflare R2
  private async uploadToR2(
    filePath: string,
    key: string,
    contentType: string
  ): Promise<string> {
    try {
      logger.info('Iniciando upload para Cloudflare R2', { key });
      
      const fileContent = await fs.readFile(filePath);
      
      const params = {
        Bucket: R2_CONFIG.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: contentType
      };
      
      const command = new PutObjectCommand(params);
      await this.s3Client.send(command);
      
      // Em vez de retornar uma URL pública direta, retorne a chave do objeto
      // A URL pública será gerada através de URLs assinadas quando necessário
      const objectKey = key;
      
      logger.info('Upload para Cloudflare R2 concluído', { key });
      
      return objectKey;
    } catch (error) {
      logger.error('Erro ao fazer upload para Cloudflare R2', { error, key });
      throw error;
    }
  }

  // Método para gerar URL assinada para acesso temporário
  public async generateSignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_CONFIG.bucketName,
        Key: key,
      });
      
      const signedUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn: getUrlExpiration()
      });
      
      return signedUrl;
    } catch (error) {
      logger.error('Erro ao gerar URL assinada', { error, key });
      throw error;
    }
  }

  async generateThumbnail(videoPath: string, videoId: string): Promise<string> {
    const thumbnailPath = path.join(storageConfig.thumbnailDir, `${videoId}.jpg`);
    
    // Garantir que o diretório existe
    await this.ensureDirectoryExists(storageConfig.thumbnailDir);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '640x360'
        })
        .on('start', (commandLine) => {
          logger.info('Iniciando geração de thumbnail', { 
            videoId,
            command: commandLine 
          });
        })
        .on('end', async () => {
          logger.info('Thumbnail gerada com sucesso', { 
            videoId, 
            thumbnailPath 
          });
          
          try {
            // Upload da thumbnail para R2
            const thumbnailKey = `thumbnails/${videoId}.jpg`;
            const thumbnailUrl = await this.uploadToR2(
              thumbnailPath,
              thumbnailKey,
              'image/jpeg'
            );
            
            // Remover arquivo local após upload
            await fs.unlink(thumbnailPath);
            
            resolve(thumbnailUrl);
          } catch (error) {
            logger.error('Erro ao fazer upload da thumbnail', { error, videoId });
            reject(error);
          }
        })
        .on('error', (err) => {
          logger.error('Erro ao gerar thumbnail', { 
            error: err, 
            videoId 
          });
          reject(err);
        });
    });
  }

  async processVideo(videoPath: string, videoId: string): Promise<{
    high: string;
    medium: string;
    low: string;
  }> {
    // Garantir que o diretório de processamento existe
    await this.ensureDirectoryExists(storageConfig.processedDir);

    const qualities = storageConfig.videoQualities;
    const processedPaths = {
      high: path.join(storageConfig.processedDir, `${videoId}_high.mp4`),
      medium: path.join(storageConfig.processedDir, `${videoId}_medium.mp4`),
      low: path.join(storageConfig.processedDir, `${videoId}_low.mp4`)
    };

    const processQuality = async (quality: keyof typeof qualities) => {
      const { width, height, bitrate } = qualities[quality];
      const outputPath = processedPaths[quality];

      return new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
          .size(`${width}x${height}`)
          .videoBitrate(bitrate)
          .format('mp4')
          .on('start', (commandLine) => {
            logger.info(`Iniciando processamento ${quality}`, { 
              videoId, 
              quality,
              command: commandLine 
            });
          })
          .on('progress', (progress) => {
            logger.info(`Progresso do processamento ${quality}`, { 
              videoId, 
              quality,
              progress: progress.percent 
            });
          })
          .on('end', () => {
            logger.info(`Processamento ${quality} concluído`, { 
              videoId, 
              quality 
            });
            resolve();
          })
          .on('error', (err) => {
            logger.error(`Erro no processamento ${quality}`, { 
              error: err, 
              videoId, 
              quality 
            });
            reject(err);
          })
          .save(outputPath);
      });
    };

    try {
      // Processar qualidades em paralelo
      await Promise.all([
        processQuality('high'),
        processQuality('medium'),
        processQuality('low')
      ]);

      // Upload para Cloudflare R2
      const cloudflareUrls = {
        high: await this.uploadToR2(
          processedPaths.high,
          `videos/${videoId}_high.mp4`,
          'video/mp4'
        ),
        medium: await this.uploadToR2(
          processedPaths.medium,
          `videos/${videoId}_medium.mp4`,
          'video/mp4'
        ),
        low: await this.uploadToR2(
          processedPaths.low,
          `videos/${videoId}_low.mp4`,
          'video/mp4'
        )
      };
      
      // Remover arquivos locais após upload
      await Promise.all([
        fs.unlink(processedPaths.high),
        fs.unlink(processedPaths.medium),
        fs.unlink(processedPaths.low)
      ]);
      
      return cloudflareUrls;
    } catch (error) {
      logger.error('Erro no processamento do vídeo', { 
        error, 
        videoId 
      });
      throw error;
    } finally {
      // Limpar arquivo original após processamento
      try {
        await fs.unlink(videoPath);
        logger.info('Arquivo original removido após processamento', { 
          videoId 
        });
      } catch (error) {
        logger.error('Erro ao remover arquivo original', { 
          error, 
          videoId 
        });
      }
    }
  }

  async validateVideo(videoPath: string): Promise<{
    duration: number;
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error('Erro ao validar vídeo', { error: err });
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('Arquivo não contém stream de vídeo válido'));
          return;
        }

        const duration = metadata.format.duration || 0;
        if (duration > storageConfig.maxDuration) {
          reject(new Error(`Vídeo muito longo. A duração máxima permitida é ${storageConfig.maxDuration / 3600} horas`));
          return;
        }

        resolve({
          duration,
          width: videoStream.width || 0,
          height: videoStream.height || 0
        });
      });
    });
  }
} 