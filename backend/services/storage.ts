import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import logger from '../utils/logger';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config/storage';

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);

// Verificar configurações do R2
if (!config.r2.endpoint || !config.r2.accessKeyId || !config.r2.secretAccessKey || !config.r2.bucketName) {
  logger.error('Configurações do R2 incompletas', {
    hasEndpoint: !!config.r2.endpoint,
    hasAccessKey: !!config.r2.accessKeyId,
    hasSecretKey: !!config.r2.secretAccessKey,
    hasBucket: !!config.r2.bucketName
  });
  throw new Error('Configurações do R2 incompletas');
}

// Cliente S3 para Cloudflare R2
const s3Client = new S3Client({
  region: config.r2.region,
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey
  }
});

logger.info('Cliente S3 inicializado', {
  endpoint: config.r2.endpoint,
  region: config.r2.region,
  bucket: config.r2.bucketName
});

// Diretório base para armazenamento de arquivos
const BASE_STORAGE_DIR = path.join(process.cwd(), 'storage');

/**
 * Garante que os diretórios de armazenamento existam
 */
export const ensureStorageDirectories = async () => {
  try {
    // Criar diretório base se não existir
    if (!fs.existsSync(BASE_STORAGE_DIR)) {
      await mkdirAsync(BASE_STORAGE_DIR, { recursive: true });
    }

    // Criar subdiretórios para cada tipo de arquivo
    const subdirs = ['accidents', 'temp', 'profiles'];
    for (const dir of subdirs) {
      const fullPath = path.join(BASE_STORAGE_DIR, dir);
      if (!fs.existsSync(fullPath)) {
        await mkdirAsync(fullPath, { recursive: true });
      }
    }

    logger.info('Diretórios de armazenamento verificados com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao criar diretórios de armazenamento', { error });
    throw new Error('Falha ao configurar diretórios de armazenamento');
  }
};

/**
 * Faz upload de um arquivo para o R2
 */
export const uploadToR2 = async (buffer: Buffer, key: string, contentType: string): Promise<void> => {
  try {
    const command = new PutObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('Erro ao fazer upload para R2', { error, key });
    throw new Error('Falha ao fazer upload do arquivo');
  }
};

/**
 * Gera uma URL assinada para download do arquivo do R2
 */
export const getSignedUrl = async (key: string): Promise<string> => {
  try {
    // Sempre gerar URL assinada do R2, mesmo em desenvolvimento
    logger.info('Iniciando geração de URL assinada', { 
      key,
      bucket: config.r2.bucketName,
      endpoint: config.r2.endpoint
    });

    const command = new GetObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key
    });

    logger.info('Configuração do cliente S3', {
      region: config.r2.region,
      hasAccessKey: !!config.r2.accessKeyId,
      hasSecretKey: !!config.r2.secretAccessKey,
      expiresIn: config.r2.urlExpiration
    });

    const url = await awsGetSignedUrl(s3Client, command, { 
      expiresIn: config.r2.urlExpiration 
    });

    logger.info('URL assinada gerada com sucesso', { url });
    return url;
  } catch (error) {
    logger.error('Erro ao gerar URL assinada', { 
      error, 
      key,
      errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
      errorStack: error instanceof Error ? error.stack : undefined,
      isDev: process.env.NODE_ENV === 'development'
    });
    throw new Error('Falha ao gerar URL de acesso ao arquivo');
  }
};

/**
 * Remove um arquivo do R2
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.r2.bucketName,
      Key: key
    });

    await s3Client.send(command);
  } catch (error) {
    logger.error('Erro ao excluir arquivo do R2', { error, key });
    throw new Error('Falha ao excluir arquivo');
  }
};

/**
 * Faz upload de um arquivo para o sistema de arquivos local
 */
export const uploadFile = async (buffer: Buffer, fileName: string, subdir = 'temp'): Promise<string> => {
  try {
    await ensureStorageDirectories();
    
    const dirPath = path.join(BASE_STORAGE_DIR, subdir);
    const filePath = path.join(dirPath, fileName);
    
    await writeFileAsync(filePath, buffer);
    
    // Retorna o caminho relativo ao servidor
    const relativePath = path.join('/storage', subdir, fileName);
    logger.info(`Arquivo salvo com sucesso em ${filePath}`);
    
    return relativePath;
  } catch (error) {
    logger.error('Erro ao fazer upload de arquivo', { error, fileName });
    throw new Error('Falha ao salvar arquivo');
  }
};

/**
 * Remove um arquivo do sistema de arquivos local
 */
export const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // Verifica se o caminho é relativo ou absoluto
    const fullPath = filePath.startsWith('/storage') 
      ? path.join(process.cwd(), filePath.substring(1)) 
      : filePath;
    
    // Verifica se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      logger.warn(`Tentativa de excluir arquivo inexistente: ${fullPath}`);
      return false;
    }
    
    await unlinkAsync(fullPath);
    logger.info(`Arquivo excluído com sucesso: ${fullPath}`);
    
    return true;
  } catch (error) {
    logger.error('Erro ao excluir arquivo', { error, filePath });
    throw new Error('Falha ao excluir arquivo');
  }
};

// Inicializar diretórios ao importar o módulo
ensureStorageDirectories().catch(error => {
  logger.error('Falha na inicialização dos diretórios de armazenamento', { error });
}); 