
import { MongoClient, ServerApiVersion } from "mongodb";

// Variável para armazenar a conexão do client MongoDB
let client: MongoClient | null = null;
let isConnecting = false;

// Função para conectar ao MongoDB
export async function connectToDatabase() {
  if (client) {
    return client;
  }

  if (isConnecting) {
    // Espera até que a conexão seja estabelecida
    while (isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return client;
  }

  try {
    isConnecting = true;
    const uri = import.meta.env.VITE_MONGODB_URI;
    
    if (!uri) {
      throw new Error("VITE_MONGODB_URI não está definido no ambiente");
    }

    console.log("Conectando ao MongoDB Atlas...");
    
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    
    await client.connect();
    console.log("Conectado ao MongoDB Atlas com sucesso!");
    
    return client;
  } catch (error) {
    console.error("Erro ao conectar ao MongoDB:", error);
    throw error;
  } finally {
    isConnecting = false;
  }
}

// Função para obter uma coleção específica
export async function getCollection(collectionName: string) {
  const client = await connectToDatabase();
  return client.db("robbialac_security").collection(collectionName);
}

// Função para fechar a conexão quando necessário
export async function closeConnection() {
  if (client) {
    await client.close();
    client = null;
    console.log("Conexão com MongoDB fechada");
  }
}
