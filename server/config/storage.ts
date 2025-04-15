import path from 'path';
import { randomUUID } from 'crypto';

// Configurações de armazenamento
export const storageConfig = {
  // Diretório base para uploads
  uploadDir: path.join(process.cwd(), 'uploads'),
  
  // Diretório temporário para uploads em andamento
  tempDir: path.join(process.cwd(), 'temp'),
  
  // Diretório para thumbnails
  thumbnailDir: path.join(process.cwd(), 'uploads', 'thumbnails'),
  
  // Diretório para vídeos processados
  processedDir: path.join(process.cwd(), 'uploads', 'processed'),
  
  // Tamanho máximo de arquivo (10GB)
  maxFileSize: 10 * 1024 * 1024 * 1024,
  
  // Duração máxima de vídeo (4 horas em segundos)
  maxDuration: 14400,
  
  // Tipos de arquivo permitidos
  allowedMimeTypes: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska'
  ],
  
  // Extensões permitidas
  allowedExtensions: ['.mp4', '.mov', '.avi', '.mkv'],
  
  // Função para gerar nome de arquivo único
  generateFileName: (originalname: string): string => {
    const ext = path.extname(originalname).toLowerCase();
    const uniqueId = randomUUID();
    return `${uniqueId}${ext}`;
  },
  
  // Qualidades de vídeo para transcodificação
  videoQualities: {
    high: { width: 1920, height: 1080, bitrate: '4000k' },
    medium: { width: 1280, height: 720, bitrate: '2000k' },
    low: { width: 854, height: 480, bitrate: '1000k' }
  }
};

// Função para criar diretórios necessários
export const ensureStorageDirectories = async (): Promise<void> => {
  const fs = await import('fs/promises');
  const directories = [
    storageConfig.uploadDir,
    storageConfig.tempDir,
    storageConfig.thumbnailDir,
    storageConfig.processedDir
  ];

  for (const dir of directories) {
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}; 