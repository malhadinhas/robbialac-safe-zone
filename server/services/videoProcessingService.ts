import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promises as fs } from 'fs';
import { storageConfig } from '../config/storage';
import logger from '../utils/logger';

export class VideoProcessor {
  async generateThumbnail(videoPath: string, videoId: string): Promise<string> {
    const thumbnailPath = path.join(storageConfig.thumbnailDir, `${videoId}.jpg`);
    
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['00:00:01'],
          filename: path.basename(thumbnailPath),
          folder: path.dirname(thumbnailPath),
          size: '640x360'
        })
        .on('end', () => {
          logger.info('Thumbnail gerada com sucesso', { videoId, thumbnailPath });
          resolve(thumbnailPath);
        })
        .on('error', (err) => {
          logger.error('Erro ao gerar thumbnail', { error: err, videoId });
          reject(err);
        });
    });
  }

  async processVideo(videoPath: string, videoId: string): Promise<{
    high: string;
    medium: string;
    low: string;
  }> {
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
          .on('end', () => {
            logger.info(`Processamento ${quality} concluído`, { videoId, quality });
            resolve();
          })
          .on('error', (err) => {
            logger.error(`Erro no processamento ${quality}`, { error: err, videoId, quality });
            reject(err);
          })
          .save(outputPath);
      });
    };

    try {
      await Promise.all([
        processQuality('high'),
        processQuality('medium'),
        processQuality('low')
      ]);

      return processedPaths;
    } catch (error) {
      logger.error('Erro no processamento do vídeo', { error, videoId });
      throw error;
    } finally {
      // Limpar arquivo original após processamento
      try {
        await fs.unlink(videoPath);
        logger.info('Arquivo original removido após processamento', { videoId });
      } catch (error) {
        logger.error('Erro ao remover arquivo original', { error, videoId });
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
          reject(new Error(`Vídeo muito longo. Duração máxima permitida: ${storageConfig.maxDuration / 3600} horas`));
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