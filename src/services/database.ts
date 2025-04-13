
import { MongoDBConfig, getMongoConfig } from "@/config/database";
import { MongoClient, Collection, Document } from "mongodb";

// Variável para armazenar o client MongoDB
let client: MongoClient | null = null;
let isConnecting = false;
let connectionError: Error | null = null;

/**
 * Função para conectar ao MongoDB Atlas
 */
export async function connectToDatabase(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  if (isConnecting) {
    // Espera até que a conexão seja estabelecida
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Se houve um erro durante a tentativa de conexão
    if (connectionError) {
      throw connectionError;
    }
    
    return client as MongoClient;
  }

  try {
    isConnecting = true;
    connectionError = null;
    
    const config = getMongoConfig();
    console.log("Tentando conectar ao MongoDB com URI:", config.uri.substring(0, 20) + "...");
    
    const { MongoClient } = await import('mongodb');
    client = new MongoClient(config.uri);
    await client.connect();
    console.log("Conectado ao MongoDB Atlas com sucesso!");
    
    return client;
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    connectionError = error instanceof Error ? error : new Error("Erro desconhecido ao conectar");
    throw error;
  } finally {
    isConnecting = false;
  }
}

/**
 * Função para obter uma coleção específica
 */
export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  try {
    const client = await connectToDatabase();
    const config = getMongoConfig();
    return client.db(config.dbName).collection<T>(collectionName);
  } catch (error) {
    console.error(`Erro ao obter coleção ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Função para fechar a conexão quando necessário
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    console.log("Conexão com banco de dados fechada");
  }
}

/**
 * Função para inicializar o banco de dados com estruturas necessárias
 * Esta função deve ser chamada ao iniciar a aplicação
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const client = await connectToDatabase();
    const config = getMongoConfig();
    const db = client.db(config.dbName);
    
    // Lista de coleções que devemos garantir que existam
    const requiredCollections = ['videos', 'users', 'incidents', 'medals'];
    
    // Verifica quais coleções já existem
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(c => c.name);
    
    // Cria as coleções que não existem
    for (const collectionName of requiredCollections) {
      if (!existingCollections.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`Coleção ${collectionName} criada com sucesso`);
      }
    }
    
    console.log("Inicialização do banco de dados concluída");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    throw error;
  }
}

/**
 * Função para verificar o status da conexão com o banco de dados
 */
export function getDatabaseConnectionStatus(): { connected: boolean; error: string | null } {
  return {
    connected: client !== null,
    error: connectionError ? connectionError.message : null
  };
}
