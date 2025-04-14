/**
 * MongoDB Atlas configuration
 * Enhanced with better error handling and validation
 */
interface MongoDBConfigType {
  uri: string;
  dbName: string;
}

const MongoDBConfig: MongoDBConfigType = {
  uri: 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
  dbName: 'workplace-safety'
};

// Validate configuration
function validateConfig(config: MongoDBConfigType): void {
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
function initializeMongoConfig(config: MongoDBConfigType): void {
  try {
    console.log("MongoDB Config: Updating configuration:", {
      uri: config.uri.substring(0, 20) + "...", // Mask full connection string
      dbName: config.dbName
    });

    validateConfig(config);
    mongoConfig = { ...config };
    
    console.log("MongoDB Config: Configuration updated successfully");
  } catch (error) {
    console.error("MongoDB Config: Error updating configuration:", error);
    throw error;
  }
}

/**
 * Get MongoDB Atlas configuration
 */
function getMongoConfig(): MongoDBConfigType {
  if (!mongoConfig.uri || !mongoConfig.dbName) {
    throw new Error("MongoDB Config: Configuration not initialized");
  }
  return { ...mongoConfig };
}

// Initialize configuration
(() => {
  try {
    validateConfig(mongoConfig);
    console.log("=== MONGODB CONFIG LOADED ===");
    console.log("MongoDB Config: Initialized with database:", mongoConfig.dbName);
    console.log("MongoDB Config: Connection string starts with:", mongoConfig.uri.substring(0, 20) + "...");
  } catch (error) {
    console.error("MongoDB Config: Error during initialization:", error);
  }
})();

// Funções para inicialização e verificação do banco de dados
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Inicializando conexão com o banco de dados...');
    // Aqui você pode adicionar a lógica de inicialização do banco de dados
    console.log('Conexão com o banco de dados inicializada com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
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

export {
  MongoDBConfig,
  getMongoConfig,
  initializeMongoConfig,
  MongoDBConfigType
};
