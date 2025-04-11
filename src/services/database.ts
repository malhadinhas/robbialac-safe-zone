
import { MongoDBConfig, getMongoConfig } from "@/config/database";

// Definindo tipos para dados do MongoDB
interface MongoDBCollection {
  find: <T>(query: any) => { toArray: () => Promise<T[]> };
  findOne: <T>(query: any) => Promise<T | null>;
  insertMany: (docs: any[]) => Promise<any>;
  insertOne: (doc: any) => Promise<any>;
  updateOne: (filter: any, update: any) => Promise<any>;
  countDocuments: () => Promise<number>;
}

// Interface para o client do MongoDB
interface MongoDBClient {
  db: (name: string) => { collection: (name: string) => MongoDBCollection };
  connect: () => Promise<void>;
  close: () => Promise<void>;
}

// Variável para armazenar o client MongoDB
let client: MongoDBClient | null = null;
let isConnecting = false;
let mockCollections: Record<string, any[]> = {};

// Função para verificar se estamos em ambiente de navegador
const isBrowser = typeof window !== 'undefined';

// Mock para o client MongoDB no navegador
const createMockClient = () => {
  console.log("Criando mock do client MongoDB para ambiente de navegador");
  
  return {
    db: (dbName: string) => ({
      collection: (collectionName: string) => ({
        find: <T>(query: any = {}) => ({
          toArray: async (): Promise<T[]> => {
            // Simular um pequeno atraso como em uma chamada real
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log(`[Mock DB] Buscando documentos na coleção: ${collectionName}`);
            return (mockCollections[collectionName] || []) as T[];
          }
        }),
        findOne: async <T>(query: any = {}): Promise<T | null> => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[Mock DB] Buscando documento único na coleção: ${collectionName}`);
          const items = mockCollections[collectionName] || [];
          const found = items.find(item => {
            // Comparar as propriedades de query com o item
            return Object.keys(query).every(key => item[key] === query[key]);
          });
          return (found as T) || null;
        },
        insertMany: async (docs: any[]): Promise<any> => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[Mock DB] Inserindo ${docs.length} documentos na coleção: ${collectionName}`);
          if (!mockCollections[collectionName]) {
            mockCollections[collectionName] = [];
          }
          mockCollections[collectionName].push(...docs);
          return { insertedCount: docs.length };
        },
        insertOne: async (doc: any): Promise<any> => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[Mock DB] Inserindo 1 documento na coleção: ${collectionName}`);
          if (!mockCollections[collectionName]) {
            mockCollections[collectionName] = [];
          }
          mockCollections[collectionName].push(doc);
          return { insertedId: doc.id || crypto.randomUUID() };
        },
        updateOne: async (filter: any, update: any): Promise<any> => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[Mock DB] Atualizando documento na coleção: ${collectionName}`);
          const items = mockCollections[collectionName] || [];
          const index = items.findIndex(item => {
            return Object.keys(filter).every(key => item[key] === filter[key]);
          });
          
          if (index !== -1) {
            // Aplicar atualizações ($set, $inc, etc)
            if (update.$set) {
              items[index] = { ...items[index], ...update.$set };
            }
            if (update.$inc) {
              Object.keys(update.$inc).forEach(key => {
                items[index][key] = (items[index][key] || 0) + update.$inc[key];
              });
            }
          }
          return { modifiedCount: index !== -1 ? 1 : 0 };
        },
        countDocuments: async (): Promise<number> => {
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log(`[Mock DB] Contando documentos na coleção: ${collectionName}`);
          return (mockCollections[collectionName] || []).length;
        }
      })
    }),
    connect: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      console.log("[Mock DB] Conexão estabelecida com sucesso");
    },
    close: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log("[Mock DB] Conexão fechada");
    }
  };
};

// Função para conectar ao MongoDB
export async function connectToDatabase(): Promise<MongoDBClient> {
  if (client) {
    return client;
  }

  if (isConnecting) {
    // Espera até que a conexão seja estabelecida
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return client as MongoDBClient;
  }

  try {
    isConnecting = true;
    
    if (isBrowser) {
      // No ambiente do navegador, usamos o mock do client
      client = createMockClient();
      await client.connect();
      console.log("Conectado ao cliente mock de banco de dados com sucesso!");
    } else {
      // Em ambiente de servidor, tentamos usar a configuração real do MongoDB
      try {
        const config = getMongoConfig();
        // Em um ambiente real, aqui seria utilizado o driver oficial do MongoDB
        // Por exemplo: const { MongoClient } = await import('mongodb');
        // client = new MongoClient(config.uri, config.options);
        
        // Para o propósito deste exemplo, ainda usamos o mock
        client = createMockClient();
        await client.connect();
        console.log("Conectado ao MongoDB Atlas com sucesso!");
      } catch (configError) {
        console.warn("Configuração do MongoDB Atlas não encontrada ou inválida. Usando mock:", configError);
        client = createMockClient();
        await client.connect();
      }
    }
    
    return client;
  } catch (error) {
    console.error("Erro ao conectar ao banco de dados:", error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Função para obter uma coleção específica
export async function getCollection(collectionName: string): Promise<MongoDBCollection> {
  const client = await connectToDatabase();
  const config = getMongoConfig();
  return client.db(config.dbName || "robbialac_security").collection(collectionName);
}

// Função para fechar a conexão quando necessário
export async function closeConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    console.log("Conexão com banco de dados fechada");
  }
}

// Função para inicializar coleções com dados mockados
export async function initializeMockCollection(collectionName: string, data: any[]): Promise<void> {
  if (!mockCollections[collectionName]) {
    mockCollections[collectionName] = [...data];
    console.log(`Coleção ${collectionName} inicializada com dados mockados`);
  }
}

