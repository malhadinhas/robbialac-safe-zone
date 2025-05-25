/**
 * @module server/config/database
 * @description Este módulo gerencia a configuração da conexão com o banco de dados MongoDB.
 * Ele carrega as informações de conexão (URI e nome do banco de dados) a partir
 * de variáveis de ambiente, com valores padrão como fallback. Também fornece
 * funções para obter e validar essa configuração.
 */
import { config } from 'dotenv';
import { DatabaseConfig } from '../types';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

// Carrega as variáveis de ambiente do arquivo .env para process.env.
// Esta é uma prática padrão para gerenciar configurações sensíveis fora do código.
config();

/**
 * @constant databaseConfig
 * @description Objeto que armazena a configuração do banco de dados.
 * Busca os valores de MONGODB_URI e MONGODB_DB_NAME nas variáveis de ambiente.
 * Se não encontrados, utiliza valores padrão (hardcoded).
 * @property {string} uri - A string de conexão do MongoDB.
 * @property {string} dbName - O nome do banco de dados a ser utilizado.
 */
const databaseConfig: DatabaseConfig = {
  /**
   * A string de conexão (URI) para o MongoDB.
   * Prioriza a variável de ambiente MONGODB_URI.
   * ATENÇÃO: O valor padrão hardcoded contém credenciais e não é recomendado para produção.
   * É mais seguro configurar esta URI exclusivamente através de variáveis de ambiente.
   */
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/robbialac-safe-zone',
  /**
   * O nome do banco de dados a ser utilizado.
   * Prioriza a variável de ambiente MONGODB_DB_NAME.
   * Se não definida, usa 'workplace-safety' como padrão.
   */
  dbName: process.env.MONGODB_DB_NAME || 'workplace-safety'
};

/**
 * @function getDatabaseConfig
 * @description Retorna uma cópia do objeto de configuração do banco de dados.
 * Usar uma cópia previne modificações acidentais na configuração original mantida neste módulo.
 * @returns {DatabaseConfig} Uma cópia do objeto databaseConfig.
 */
export function getDatabaseConfig(): DatabaseConfig {
  // Retorna um novo objeto ({...}) com as mesmas propriedades para evitar mutação externa.
  return { ...databaseConfig };
}

/**
 * @function validateDatabaseConfig
 * @description Verifica se a configuração do banco de dados fornecida é válida.
 * Garante que a URI e o nome do banco de dados estão definidos e que a URI
 * tem o formato esperado ('mongodb://' ou 'mongodb+srv://') para uma conexão MongoDB.
 * Lança um erro se a configuração for inválida, impedindo a aplicação de iniciar com dados incorretos.
 * @param {DatabaseConfig} config - O objeto de configuração a ser validado.
 * @throws {Error} Se a URI não estiver definida.
 * @throws {Error} Se a URI não começar com 'mongodb'.
 * @throws {Error} Se o nome do banco de dados não estiver definido.
 */
export function validateDatabaseConfig(config: DatabaseConfig): void {
  // Garante que a URI existe.
  if (!config.uri) {
    throw new Error('URI do MongoDB não definida');
  }
  
  // Verifica se a URI começa com 'mongodb', cobrindo 'mongodb://' e 'mongodb+srv://'.
  if (!config.uri.startsWith('mongodb')) {
    throw new Error('URI do MongoDB inválida (deve começar com \'mongodb://\' ou \'mongodb+srv://\')');
  }
  
  // Garante que o nome do banco de dados existe.
  if (!config.dbName) {
    throw new Error('Nome do banco de dados não definido');
  }
}

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/robbialac-safe-zone';
    await mongoose.connect(mongoUri);
    logger.info('Conectado ao MongoDB');
  } catch (error) {
    logger.error('Erro ao conectar ao MongoDB:', { error });
    throw error;
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('Desconectado do MongoDB');
  } catch (error) {
    logger.error('Erro ao desconectar do MongoDB:', { error });
    throw error;
  }
}; 