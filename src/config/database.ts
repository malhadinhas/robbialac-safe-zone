
/**
 * MongoDB Atlas configuration
 */
export interface MongoDBConfig {
  uri: string;
  dbName: string;
}

// Load MongoDB configuration from environment variables
const defaultConfig: MongoDBConfig = {
  uri: import.meta.env.VITE_MONGODB_URI || 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
  dbName: import.meta.env.VITE_MONGODB_DB_NAME || 'workplace-safety'
};

// Store current configuration
let mongoConfig: MongoDBConfig = { ...defaultConfig };

/**
 * Initialize MongoDB Atlas configuration
 */
export function initializeMongoConfig(config: MongoDBConfig): void {
  console.log("MongoDB Config: Updating configuration:", {
    uri: config.uri.substring(0, 20) + "...", // Mask full connection string
    dbName: config.dbName
  });
  mongoConfig = { ...config };
  console.log("MongoDB Config: Configuration updated successfully");
}

/**
 * Get MongoDB Atlas configuration
 */
export function getMongoConfig(): MongoDBConfig {
  console.log("MongoDB Config: Getting current configuration, database:", mongoConfig.dbName);
  return mongoConfig;
}

// Initialization log
console.log("=== MONGODB CONFIG LOADED ===");
console.log("MongoDB Config: Initialized with database:", mongoConfig.dbName);
console.log("MongoDB Config: Connection string starts with:", mongoConfig.uri.substring(0, 20) + "...");

