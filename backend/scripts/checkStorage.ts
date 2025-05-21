import { promises as fs } from 'fs';
import path from 'path';
import { storageConfig } from '../config/storage';
import logger from '../utils/logger';

async function checkDirectory(directory: string, name: string): Promise<boolean> {
  try {
    await fs.access(directory);
    const stats = await fs.stat(directory);
    if (!stats.isDirectory()) {
      logger.error(`${name} não é um diretório`, { path: directory });
      return false;
    }
    logger.info(`${name} verificado com sucesso`, { path: directory });
    return true;
  } catch (error) {
    logger.error(`Erro ao verificar ${name}`, { 
      path: directory,
      error 
    });
    return false;
  }
}

async function checkPermissions(directory: string, name: string): Promise<boolean> {
  try {
    // Tentar criar um arquivo temporário para verificar permissões
    const testFile = path.join(directory, `.test_${Date.now()}`);
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    logger.info(`Permissões de ${name} verificadas com sucesso`, { path: directory });
    return true;
  } catch (error) {
    logger.error(`Erro nas permissões de ${name}`, { 
      path: directory,
      error 
    });
    return false;
  }
}

async function main() {
  logger.info('Iniciando verificação de armazenamento');
  
  const directories = [
    { path: storageConfig.uploadDir, name: 'Diretório de uploads' },
    { path: storageConfig.tempDir, name: 'Diretório temporário' },
    { path: storageConfig.thumbnailDir, name: 'Diretório de thumbnails' },
    { path: storageConfig.processedDir, name: 'Diretório de vídeos processados' }
  ];

  let allOk = true;

  for (const dir of directories) {
    const exists = await checkDirectory(dir.path, dir.name);
    if (!exists) {
      try {
        await fs.mkdir(dir.path, { recursive: true });
        logger.info(`${dir.name} criado com sucesso`, { path: dir.path });
      } catch (error) {
        logger.error(`Erro ao criar ${dir.name}`, { 
          path: dir.path,
          error 
        });
        allOk = false;
        continue;
      }
    }

    const hasPermissions = await checkPermissions(dir.path, dir.name);
    if (!hasPermissions) {
      allOk = false;
    }
  }

  if (allOk) {
    logger.info('Verificação de armazenamento concluída com sucesso');
  } else {
    logger.error('Verificação de armazenamento encontrou problemas');
  }
}

export const checkStorage = main; 