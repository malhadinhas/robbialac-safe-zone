"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProcessor = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const storage_1 = require("../config/storage");
const logger_1 = __importDefault(require("../utils/logger"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
// Configurações do Cloudflare R2
const R2_CONFIG = {
    endpoint: process.env.R2_ENDPOINT || 'https://485c3c736434b646ff46725121de873c.r2.cloudflarestorage.com',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '56f3925666837ff8ba99087b930e88cb',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '31352a5a4c56a50c5f05cd7cdcb1d010f6fd6a24f32c2b1560bc56a613c266cc',
    bucketName: process.env.R2_BUCKET_NAME || 'workplace-safety-videos',
    region: 'auto'
};
// Obter o tempo de expiração das URLs assinadas da configuração ou usar o padrão
const getUrlExpiration = () => {
    const expiration = Number(process.env.R2_URL_EXPIRATION);
    return !isNaN(expiration) ? expiration : 3600; // Padrão: 1 hora
};
class VideoProcessor {
    s3Client;
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: R2_CONFIG.region,
            endpoint: R2_CONFIG.endpoint,
            credentials: {
                accessKeyId: R2_CONFIG.accessKeyId,
                secretAccessKey: R2_CONFIG.secretAccessKey,
            },
        });
    }
    async ensureDirectoryExists(dir) {
        try {
            await fs_1.promises.access(dir);
        }
        catch {
            await fs_1.promises.mkdir(dir, { recursive: true });
        }
    }
    // Upload para Cloudflare R2
    async uploadToR2(filePath, key, contentType) {
        try {
            logger_1.default.info('Iniciando upload para Cloudflare R2', { key });
            const fileContent = await fs_1.promises.readFile(filePath);
            const params = {
                Bucket: R2_CONFIG.bucketName,
                Key: key,
                Body: fileContent,
                ContentType: contentType
            };
            const command = new client_s3_1.PutObjectCommand(params);
            await this.s3Client.send(command);
            // Em vez de retornar uma URL pública direta, retorne a chave do objeto
            // A URL pública será gerada através de URLs assinadas quando necessário
            const objectKey = key;
            logger_1.default.info('Upload para Cloudflare R2 concluído', { key });
            return objectKey;
        }
        catch (error) {
            logger_1.default.error('Erro ao fazer upload para Cloudflare R2', { error, key });
            throw error;
        }
    }
    // Método para gerar URL assinada para acesso temporário
    async generateSignedUrl(key) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: R2_CONFIG.bucketName,
                Key: key,
            });
            const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
                expiresIn: getUrlExpiration()
            });
            return signedUrl;
        }
        catch (error) {
            logger_1.default.error('Erro ao gerar URL assinada', { error, key });
            throw error;
        }
    }
    async generateThumbnail(videoPath, videoId) {
        const thumbnailPath = path_1.default.join(storage_1.storageConfig.thumbnailDir, `${videoId}.jpg`);
        // Garantir que o diretório existe
        await this.ensureDirectoryExists(storage_1.storageConfig.thumbnailDir);
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .screenshots({
                timestamps: ['00:00:01'],
                filename: path_1.default.basename(thumbnailPath),
                folder: path_1.default.dirname(thumbnailPath),
                size: '640x360'
            })
                .on('start', (commandLine) => {
                logger_1.default.info('Iniciando geração de thumbnail', {
                    videoId,
                    command: commandLine
                });
            })
                .on('end', async () => {
                logger_1.default.info('Thumbnail gerada com sucesso', {
                    videoId,
                    thumbnailPath
                });
                try {
                    // Upload da thumbnail para R2
                    const thumbnailKey = `thumbnails/${videoId}.jpg`;
                    const thumbnailUrl = await this.uploadToR2(thumbnailPath, thumbnailKey, 'image/jpeg');
                    // Remover arquivo local após upload
                    await fs_1.promises.unlink(thumbnailPath);
                    resolve(thumbnailUrl);
                }
                catch (error) {
                    logger_1.default.error('Erro ao fazer upload da thumbnail', { error, videoId });
                    reject(error);
                }
            })
                .on('error', (err) => {
                logger_1.default.error('Erro ao gerar thumbnail', {
                    error: err,
                    videoId
                });
                reject(err);
            });
        });
    }
    async processVideo(videoPath, videoId) {
        // Garantir que o diretório de processamento existe
        await this.ensureDirectoryExists(storage_1.storageConfig.processedDir);
        const qualities = storage_1.storageConfig.videoQualities;
        const processedPaths = {
            high: path_1.default.join(storage_1.storageConfig.processedDir, `${videoId}_high.mp4`),
            medium: path_1.default.join(storage_1.storageConfig.processedDir, `${videoId}_medium.mp4`),
            low: path_1.default.join(storage_1.storageConfig.processedDir, `${videoId}_low.mp4`)
        };
        const processQuality = async (quality) => {
            const { width, height, bitrate } = qualities[quality];
            const outputPath = processedPaths[quality];
            return new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(videoPath)
                    .size(`${width}x${height}`)
                    .videoBitrate(bitrate)
                    .format('mp4')
                    .on('start', (commandLine) => {
                    logger_1.default.info(`Iniciando processamento ${quality}`, {
                        videoId,
                        quality,
                        command: commandLine
                    });
                })
                    .on('progress', (progress) => {
                    logger_1.default.info(`Progresso do processamento ${quality}`, {
                        videoId,
                        quality,
                        progress: progress.percent
                    });
                })
                    .on('end', () => {
                    logger_1.default.info(`Processamento ${quality} concluído`, {
                        videoId,
                        quality
                    });
                    resolve();
                })
                    .on('error', (err) => {
                    logger_1.default.error(`Erro no processamento ${quality}`, {
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
                high: await this.uploadToR2(processedPaths.high, `videos/${videoId}_high.mp4`, 'video/mp4'),
                medium: await this.uploadToR2(processedPaths.medium, `videos/${videoId}_medium.mp4`, 'video/mp4'),
                low: await this.uploadToR2(processedPaths.low, `videos/${videoId}_low.mp4`, 'video/mp4')
            };
            // Remover arquivos locais após upload
            await Promise.all([
                fs_1.promises.unlink(processedPaths.high),
                fs_1.promises.unlink(processedPaths.medium),
                fs_1.promises.unlink(processedPaths.low)
            ]);
            return cloudflareUrls;
        }
        catch (error) {
            logger_1.default.error('Erro no processamento do vídeo', {
                error,
                videoId
            });
            throw error;
        }
        finally {
            // Limpar arquivo original após processamento
            try {
                await fs_1.promises.unlink(videoPath);
                logger_1.default.info('Arquivo original removido após processamento', {
                    videoId
                });
            }
            catch (error) {
                logger_1.default.error('Erro ao remover arquivo original', {
                    error,
                    videoId
                });
            }
        }
    }
    async validateVideo(videoPath) {
        return new Promise((resolve, reject) => {
            fluent_ffmpeg_1.default.ffprobe(videoPath, (err, metadata) => {
                if (err) {
                    logger_1.default.error('Erro ao validar vídeo', { error: err });
                    reject(err);
                    return;
                }
                const videoStream = metadata.streams.find(s => s.codec_type === 'video');
                if (!videoStream) {
                    reject(new Error('Arquivo não contém stream de vídeo válido'));
                    return;
                }
                const duration = metadata.format.duration || 0;
                if (duration > storage_1.storageConfig.maxDuration) {
                    reject(new Error(`Vídeo muito longo. A duração máxima permitida é ${storage_1.storageConfig.maxDuration / 3600} horas`));
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
exports.VideoProcessor = VideoProcessor;
