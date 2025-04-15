/**
 * MongoDB Atlas configuration
 * Enhanced with better error handling and validation
 */
export interface MongoDBConfigType {
  uri: string;
  dbName: string;
}

export const MongoDBConfig: MongoDBConfigType = {
  uri: 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
  dbName: 'workplace-safety'
};

// Validate configuration
export function validateConfig(config: MongoDBConfigType): void {
  if (!config.uri) {
    throw new Error("MongoDB Config Validation Error: Missing URI");
  } 
  if (!config.uri.startsWith('mongodb')) {
    throw new Error("MongoDB Config Validation Error: URI must start with 'mongodb' or 'mongodb+srv'");
  }
  if (!config.dbName) {
    throw new Error("MongoDB Config Validation Error: Missing database name");
  }
}

// Store current configuration
let mongoConfig: MongoDBConfigType = { ...MongoDBConfig };

/**
 * Initialize MongoDB Atlas configuration
 */
export function initializeMongoConfig(config: MongoDBConfigType): void {
  try {
    validateConfig(config);
    mongoConfig = { ...config };
  } catch (error) {
    throw error;
  }
}

/**
 * Get MongoDB Atlas configuration
 */
export function getMongoConfig(): MongoDBConfigType {
  if (!mongoConfig.uri || !mongoConfig.dbName) {
    throw new Error("MongoDB Config: Configuration not initialized");
  }
  return { ...mongoConfig };
}

// Initialize configuration
(() => {
  try {
    validateConfig(mongoConfig);
  } catch (error) {
    throw error;
  }
})();

// Funções para inicialização e verificação do banco de dados
export async function initializeDatabase(): Promise<void> {
  try {
    // Aqui você pode adicionar a lógica de inicialização do banco de dados
  } catch (error) {
    throw error;
  }
}

export function getDatabaseConnectionStatus() {
  return {
    connected: true, // Você pode implementar uma verificação real aqui
    error: null,
    lastChecked: new Date()
  };
}
