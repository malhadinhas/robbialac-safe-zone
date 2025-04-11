
/**
 * Configuração para conexão com MongoDB Atlas
 */
export interface MongoDBConfig {
  uri: string;
  dbName: string;
  options?: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
  };
}

// Configuração padrão para MongoDB Atlas 
const defaultConfig: MongoDBConfig = {
  uri: import.meta.env.VITE_MONGODB_URI || '',
  dbName: import.meta.env.VITE_MONGODB_DB_NAME || 'robbialac_security',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
};

// Armazena a configuração atual
let mongoConfig: MongoDBConfig = { ...defaultConfig };

/**
 * Inicializa a configuração do MongoDB Atlas
 */
export function initializeMongoConfig(config: MongoDBConfig): void {
  mongoConfig = { ...config };
  console.log("Configuração MongoDB inicializada com sucesso");
}

/**
 * Obtém a configuração do MongoDB Atlas
 */
export function getMongoConfig(): MongoDBConfig {
  return mongoConfig;
}
