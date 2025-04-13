import { config } from 'dotenv';
import { DatabaseConfig } from '../types';

// Carregar variáveis de ambiente
config();

const databaseConfig: DatabaseConfig = {
  uri: process.env.MONGODB_URI || 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
  dbName: process.env.MONGODB_DB_NAME || 'workplace-safety'
};

export function getDatabaseConfig(): DatabaseConfig {
  return { ...databaseConfig };
}

export function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.uri) {
    throw new Error('URI do MongoDB não definida');
  }
  
  if (!config.uri.startsWith('mongodb')) {
    throw new Error('URI do MongoDB inválida');
  }
  
  if (!config.dbName) {
    throw new Error('Nome do banco de dados não definido');
  }
} 