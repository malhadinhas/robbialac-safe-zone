
/**
 * Configuração para conexão com MongoDB Atlas
 */
export interface MongoDBConfig {
  uri: string;
  dbName: string;
}

// Carregamento das configurações do MongoDB a partir das variáveis de ambiente
const defaultConfig: MongoDBConfig = {
  uri: import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
  dbName: import.meta.env.VITE_MONGODB_DB_NAME || 'workplace-safety'
};

// Armazena a configuração atual
let mongoConfig: MongoDBConfig = { ...defaultConfig };

/**
 * Inicializa a configuração do MongoDB Atlas
 */
export function initializeMongoConfig(config: MongoDBConfig): void {
  console.log("Atualizando configuração MongoDB:", {
    uri: config.uri.substring(0, 20) + "...",
    dbName: config.dbName
  });
  mongoConfig = { ...config };
  console.log("Configuração MongoDB atualizada com sucesso");
}

/**
 * Obtém a configuração do MongoDB Atlas
 */
export function getMongoConfig(): MongoDBConfig {
  return mongoConfig;
}
