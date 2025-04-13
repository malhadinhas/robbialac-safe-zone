
import { MongoDBConfig, getMongoConfig } from "@/config/database";
import { MongoClient, Collection, Document, ServerApiVersion } from "mongodb";

// Variables to store MongoDB client and connection state
let mongoClient: MongoClient | null = null;
let isConnecting = false;
let connectionError: Error | null = null;
let connectionAttempts = 0;

// Log module loading
console.log("=== DATABASE SERVICE MODULE LOADED ===");

/**
 * Connect to MongoDB Atlas with enhanced error handling
 */
export async function connectToDatabase(): Promise<MongoClient> {
  try {
    console.log(`connectToDatabase: Connection check - client exists? ${mongoClient !== null}, connecting? ${isConnecting}`);
    
    if (mongoClient) {
      console.log("connectToDatabase: Reusing existing connection");
      return mongoClient;
    }

    if (isConnecting) {
      console.log("connectToDatabase: Connection attempt already in progress, waiting...");
      // Wait for the connection with timeout
      let waitTime = 0;
      const maxWait = 15000; // 15 seconds
      const checkInterval = 100; // 100ms
      
      while (isConnecting && waitTime < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
        console.log(`connectToDatabase: Still waiting for connection... (${waitTime}ms)`);
      }
      
      if (isConnecting) {
        console.error("connectToDatabase: Timeout while waiting for connection");
        throw new Error("Timeout while trying to establish MongoDB connection");
      }
      
      if (connectionError) {
        console.error("connectToDatabase: Error occurred in previous connection attempt:", connectionError);
        throw connectionError;
      }
      
      if (!mongoClient) {
        console.error("connectToDatabase: MongoDB client not initialized after connection attempt");
        throw new Error("Failed to establish MongoDB connection");
      }
      
      return mongoClient;
    }

    connectionAttempts++;
    console.log(`connectToDatabase: Starting new connection attempt #${connectionAttempts}`);
    
    try {
      isConnecting = true;
      connectionError = null;
      
      const config = getMongoConfig();
      console.log("connectToDatabase: Connection config:", {
        uriPrefix: config.uri.substring(0, 20) + "...",
        dbName: config.dbName
      });
      
      // Add additional validation for MongoDB URI
      if (!config.uri || !config.uri.startsWith('mongodb')) {
        throw new Error("Invalid MongoDB connection URI. Must start with 'mongodb' or 'mongodb+srv'");
      }
      
      const newClient = new MongoClient(config.uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        },
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 15000
      });
      
      console.log("connectToDatabase: MongoDB client created, connecting...");
      await newClient.connect();
      console.log("connectToDatabase: Connection established, checking server communication...");
      
      // Verify the connection is working with a simple ping
      await newClient.db("admin").command({ ping: 1 });
      console.log("connectToDatabase: Server ping successful!");
      
      mongoClient = newClient;
      
      console.log("connectToDatabase: MongoDB connection successfully established");
      return mongoClient;
    } catch (error) {
      console.error("connectToDatabase: Error connecting to database:", error);
      connectionError = error instanceof Error 
        ? error 
        : new Error("Unknown error connecting to MongoDB");
        
      throw connectionError;
    } finally {
      isConnecting = false;
      console.log(`connectToDatabase: Connection attempt #${connectionAttempts} completed`);
    }
  } catch (outerError) {
    // Catch all errors at the top level to prevent crashes
    console.error("connectToDatabase: Critical error in database connection:", outerError);
    connectionError = outerError instanceof Error 
      ? outerError 
      : new Error("Unknown error in database connection wrapper");
    throw connectionError;
  }
}

/**
 * Get a specific collection from the database with safe error handling
 */
export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  try {
    console.log(`getCollection: Getting collection '${collectionName}'...`);
    const client = await connectToDatabase();
    const config = getMongoConfig();
    return client.db(config.dbName).collection<T>(collectionName);
  } catch (error) {
    console.error(`getCollection: Error getting collection '${collectionName}':`, error);
    throw error;
  }
}

/**
 * Close the database connection when needed
 */
export async function closeConnection(): Promise<void> {
  try {
    if (mongoClient) {
      console.log("closeConnection: Closing database connection...");
      await mongoClient.close();
      mongoClient = null;
      console.log("closeConnection: Connection closed");
    } else {
      console.log("closeConnection: No active connection to close");
    }
  } catch (error) {
    console.error("closeConnection: Error while closing connection:", error);
  }
}

/**
 * Initialize the database with required structures
 * This function should be called when starting the application
 * Enhanced with better error handling
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("initializeDatabase: Starting database initialization...");
    
    // Check if we already have a valid connection
    if (mongoClient) {
      console.log("initializeDatabase: Using existing connection");
      return;
    }
    
    const client = await connectToDatabase();
    const config = getMongoConfig();
    const db = client.db(config.dbName);
    
    // List of required collections
    const requiredCollections = ['videos', 'users', 'incidents', 'medals'];
    
    try {
      // Check which collections already exist
      console.log("initializeDatabase: Checking existing collections...");
      const collections = await db.listCollections().toArray();
      const existingCollections = collections.map(c => c.name);
      console.log("initializeDatabase: Existing collections:", existingCollections);
      
      // Create collections that don't exist
      for (const collectionName of requiredCollections) {
        if (!existingCollections.includes(collectionName)) {
          console.log(`initializeDatabase: Creating collection '${collectionName}'...`);
          await db.createCollection(collectionName);
          console.log(`initializeDatabase: Collection '${collectionName}' created successfully`);
        }
      }
    } catch (collectionError) {
      console.error("initializeDatabase: Error managing collections, but connection was established:", collectionError);
      // We'll continue with the connection even if collection setup fails
    }
    
    console.log("initializeDatabase: Database initialization completed successfully");
  } catch (error) {
    console.error("initializeDatabase: Error initializing database:", error);
    connectionError = error instanceof Error ? error : new Error("Unknown error initializing database");
    throw error;
  }
}

/**
 * Check the status of the database connection
 * This function never throws, to ensure UI can always display status
 */
export function getDatabaseConnectionStatus(): { connected: boolean; error: string | null } {
  try {
    console.log("getDatabaseConnectionStatus: Checking connection status");
    console.log("getDatabaseConnectionStatus: Client exists?", mongoClient !== null);
    console.log("getDatabaseConnectionStatus: Connection error?", connectionError?.message);
    
    // If connecting, we don't know the real status yet
    if (isConnecting) {
      console.log("getDatabaseConnectionStatus: Connection in progress...");
      return {
        connected: false,
        error: "Connection in progress..."
      };
    }
    
    return {
      connected: mongoClient !== null,
      error: connectionError ? connectionError.message : null
    };
  } catch (error) {
    console.error("getDatabaseConnectionStatus: Unexpected error checking status:", error);
    // Return a safe value even if an error occurs
    return {
      connected: false,
      error: "Error checking connection status: " + (error instanceof Error ? error.message : String(error))
    };
  }
}

/**
 * Try to reconnect to the database
 */
export async function tryReconnect(): Promise<boolean> {
  try {
    console.log("tryReconnect: Attempting reconnection to MongoDB...");
    
    if (mongoClient) {
      console.log("tryReconnect: Closing existing connection before reconnecting...");
      await mongoClient.close().catch(err => console.error("tryReconnect: Error closing existing connection:", err));
      mongoClient = null;
    }
    
    connectionError = null;
    
    try {
      console.log("tryReconnect: Starting fresh connection attempt...");
      await connectToDatabase();
      console.log("tryReconnect: Reconnection successful!");
      return true;
    } catch (error) {
      console.error("tryReconnect: Reconnection failed:", error);
      return false;
    }
  } catch (outerError) {
    console.error("tryReconnect: Critical error in reconnection wrapper:", outerError);
    return false;
  }
}

// Log to confirm that the service is loaded
console.log("=== DATABASE SERVICE INITIALIZATION COMPLETE ===");
