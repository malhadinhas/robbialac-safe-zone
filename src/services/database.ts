
import { MongoDBConfig, getMongoConfig } from "@/config/database";
import { MongoClient, Collection, Document, ServerApiVersion } from "mongodb";

// Variável para armazenar o client MongoDB
let client: MongoClient | null = null;
let isConnecting = false;
let connectionError: Error | null = null;

// Log inicial de módulo carregado
console.log("Database service module loaded");

/**
 * Função para conectar ao MongoDB Atlas
 */
export async function connectToDatabase(): Promise<MongoClient> {
  console.log("connectToDatabase: Verificando conexão existente");
  if (client) {
    console.log("connectToDatabase: Reutilizando conexão existente com MongoDB");
    return client;
  }

  if (isConnecting) {
    console.log("connectToDatabase: Já existe uma tentativa de conexão em andamento, aguardando...");
    // Espera até que a conexão seja estabelecida com timeout
    let waitTime = 0;
    const maxWait = 10000; // 10 segundos
    const checkInterval = 100; // 100ms
    
    while (isConnecting && waitTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waitTime += checkInterval;
    }
    
    if (isConnecting) {
      console.error("connectToDatabase: Timeout ao esperar pela conexão");
      throw new Error("Timeout ao tentar estabelecer conexão com MongoDB");
    }
    
    // Se houve um erro durante a tentativa de conexão
    if (connectionError) {
      console.error("connectToDatabase: Erro na tentativa anterior de conexão:", connectionError);
      throw connectionError;
    }
    
    if (!client) {
      console.error("connectToDatabase: Cliente MongoDB não inicializado após tentativa de conexão");
      throw new Error("Falha ao estabelecer conexão com MongoDB");
    }
    
    return client;
  }

  try {
    isConnecting = true;
    connectionError = null;
    
    const config = getMongoConfig();
    console.log("connectToDatabase: Tentando conectar ao MongoDB com URI:", config.uri.substring(0, 20) + "...");
    console.log("connectToDatabase: Database:", config.dbName);
    
    const newClient = new MongoClient(config.uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log("connectToDatabase: Iniciando conexão...");
    await newClient.connect();
    console.log("connectToDatabase: Conexão estabelecida, verificando comunicação com servidor...");
    
    // Verifica se a conexão está realmente funcionando fazendo uma operação simples
    await newClient.db("admin").command({ ping: 1 });
    console.log("connectToDatabase: Ping ao servidor MongoDB realizado com sucesso!");
    
    client = newClient; // Só atribuímos após conexão bem-sucedida
    
    console.log("connectToDatabase: Conectado ao MongoDB Atlas com sucesso!");
    return client;
  } catch (error) {
    console.error("connectToDatabase: Erro detalhado ao conectar ao banco de dados:", error);
    connectionError = error instanceof Error ? error : new Error("Erro desconhecido ao conectar");
    throw error;
  } finally {
    isConnecting = false;
    console.log("connectToDatabase: Estado de conexão finalizado");
  }
}

/**
 * Função para obter uma coleção específica
 */
export async function getCollection<T extends Document>(collectionName: string): Promise<Collection<T>> {
  try {
    console.log(`getCollection: Obtendo coleção ${collectionName}`);
    const client = await connectToDatabase();
    const config = getMongoConfig();
    return client.db(config.dbName).collection<T>(collectionName);
  } catch (error) {
    console.error(`getCollection: Erro ao obter coleção ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Função para fechar a conexão quando necessário
 */
export async function closeConnection(): Promise<void> {
  if (client) {
    console.log("closeConnection: Fechando conexão com banco de dados");
    await client.close();
    client = null;
    console.log("closeConnection: Conexão fechada");
  } else {
    console.log("closeConnection: Nenhuma conexão ativa para fechar");
  }
}

/**
 * Função para inicializar o banco de dados com estruturas necessárias
 * Esta função deve ser chamada ao iniciar a aplicação
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log("initializeDatabase: Iniciando processo de inicialização do banco de dados...");
    const client = await connectToDatabase();
    const config = getMongoConfig();
    const db = client.db(config.dbName);
    
    // Lista de coleções que devemos garantir que existam
    const requiredCollections = ['videos', 'users', 'incidents', 'medals'];
    
    // Verifica quais coleções já existem
    console.log("initializeDatabase: Verificando coleções existentes...");
    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map(c => c.name);
    console.log("initializeDatabase: Coleções existentes:", existingCollections);
    
    // Cria as coleções que não existem
    for (const collectionName of requiredCollections) {
      if (!existingCollections.includes(collectionName)) {
        console.log(`initializeDatabase: Criando coleção ${collectionName}...`);
        await db.createCollection(collectionName);
        console.log(`initializeDatabase: Coleção ${collectionName} criada com sucesso`);
      }
    }
    
    console.log("initializeDatabase: Inicialização do banco de dados concluída com sucesso");
  } catch (error) {
    console.error("initializeDatabase: Erro ao inicializar banco de dados:", error);
    connectionError = error instanceof Error ? error : new Error("Erro desconhecido ao inicializar");
    throw error;
  }
}

/**
 * Função para verificar o status da conexão com o banco de dados
 */
export function getDatabaseConnectionStatus(): { connected: boolean; error: string | null } {
  console.log("getDatabaseConnectionStatus: Verificando status da conexão");
  console.log("getDatabaseConnectionStatus: Cliente existe?", client !== null);
  console.log("getDatabaseConnectionStatus: Erro de conexão?", connectionError?.message);
  
  // Se estiver conectando, ainda não sabemos o status real
  if (isConnecting) {
    console.log("getDatabaseConnectionStatus: Conexão em andamento...");
    return {
      connected: false,
      error: "Conexão em andamento..."
    };
  }
  
  return {
    connected: client !== null,
    error: connectionError ? connectionError.message : null
  };
}

/**
 * Função para tentar reconectar ao banco de dados
 */
export async function tryReconnect(): Promise<boolean> {
  console.log("tryReconnect: Tentando reconexão com o MongoDB...");
  if (client) {
    console.log("tryReconnect: Fechando conexão existente antes de tentar reconectar...");
    await client.close().catch(err => console.error("tryReconnect: Erro ao fechar conexão existente:", err));
    client = null;
  }
  
  connectionError = null;
  
  try {
    await connectToDatabase();
    console.log("tryReconnect: Reconexão bem-sucedida!");
    return true;
  } catch (error) {
    console.error("tryReconnect: Falha na tentativa de reconexão:", error);
    return false;
  }
}

// Log para confirmar que o serviço foi carregado
console.log("Database service initialized");
