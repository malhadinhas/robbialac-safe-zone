import fs from 'fs';
import path from 'path';
import logger from '../server/utils/logger';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const STORAGE_DIR = path.join(process.cwd(), 'storage', 'uploads');

async function moveDirectory(source: string, target: string) {
  try {
    // Criar diretório de destino se não existir
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
      logger.info(`Diretório criado: ${target}`);
    }

    // Ler conteúdo do diretório fonte
    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);

      if (entry.isDirectory()) {
        // Recursivamente mover subdiretórios
        await moveDirectory(sourcePath, targetPath);
        
        // Tentar remover o diretório vazio
        try {
          fs.rmdirSync(sourcePath);
          logger.info(`Diretório removido: ${sourcePath}`);
        } catch (error) {
          logger.warn(`Não foi possível remover diretório ${sourcePath}: ${error.message}`);
        }
      } else {
        // Mover arquivo
        try {
          fs.renameSync(sourcePath, targetPath);
          logger.info(`Arquivo movido: ${sourcePath} -> ${targetPath}`);
        } catch (error) {
          logger.error(`Erro ao mover arquivo ${sourcePath}: ${error.message}`);
          throw error;
        }
      }
    }
  } catch (error) {
    logger.error(`Erro ao mover diretório ${source}: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    logger.info('Iniciando movimentação de arquivos...');

    // Verificar se o diretório de uploads existe
    if (!fs.existsSync(UPLOADS_DIR)) {
      logger.warn(`Diretório de uploads não encontrado: ${UPLOADS_DIR}`);
      return;
    }

    // Criar diretório de storage se não existir
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
      logger.info(`Diretório de storage criado: ${STORAGE_DIR}`);
    }

    // Mover arquivos
    await moveDirectory(UPLOADS_DIR, STORAGE_DIR);

    // Tentar remover o diretório de uploads original
    try {
      fs.rmdirSync(UPLOADS_DIR);
      logger.info(`Diretório de uploads original removido: ${UPLOADS_DIR}`);
    } catch (error) {
      logger.warn(`Não foi possível remover diretório de uploads original: ${error.message}`);
    }

    logger.info('Movimentação concluída com sucesso!');
  } catch (error) {
    logger.error(`Erro durante a movimentação: ${error.message}`);
    process.exit(1);
  }
}

main(); 