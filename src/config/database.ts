
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

// Configuração para MongoDB Atlas (a ser preenchida)
let mongoConfig: MongoDBConfig | null = null;

/**
 * Inicializa a configuração do MongoDB Atlas
 */
export function initializeMongoConfig(config: MongoDBConfig): void {
  mongoConfig = config;
  console.log("Configuração MongoDB inicializada com sucesso");
}

/**
 * Obtém a configuração do MongoDB Atlas
 */
export function getMongoConfig(): MongoDBConfig {
  if (!mongoConfig) {
    throw new Error("Configuração MongoDB não inicializada. Chame initializeMongoConfig primeiro.");
  }
  return mongoConfig;
}

