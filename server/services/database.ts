import mongoose from 'mongoose';
import { MongoDBConfig } from '../../src/config/database';

let isConnected = false;
let connectionError: string | null = null;

export async function connectToDatabase(): Promise<void> {
  console.log('=== Iniciando conexão com o banco de dados ===');
  console.log('MONGODB_URI do process.env:', process.env.MONGODB_URI);
  
  // Se já estiver conectado, não faz nada
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Já conectado ao banco de dados');
    return;
  }

  try {
    const uri = MongoDBConfig.uri;
    console.log('URI usada na conexão:', uri);
    console.log('DB usado na conexão:', MongoDBConfig.dbName);
    
    console.log('Configuração carregada:', {
      dbName: MongoDBConfig.dbName,
      uriPrefix: uri.substring(0, 20) + '...'
    });

    // Configurar Mongoose
    mongoose.set('strictQuery', true);
    
    console.log('Conectando ao MongoDB via Mongoose...');
    await mongoose.connect(uri, {
      dbName: MongoDBConfig.dbName,
    });
    
    console.log('=== Conectado ao MongoDB com sucesso ===');
    isConnected = true;
    connectionError = null;

    // Eventos de conexão
    mongoose.connection.on('error', (err) => {
      console.error('Erro na conexão MongoDB:', err);
      isConnected = false;
      connectionError = err.message;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Desconectado do MongoDB');
      isConnected = false;
    });

  } catch (error) {
    console.error('=== Erro ao conectar ao MongoDB ===');
    console.error('Detalhes do erro:', error);
    isConnected = false;
    connectionError = error instanceof Error ? error.message : "Erro desconhecido";
    throw error;
  }
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      console.log('Desconectado do MongoDB com sucesso');
    } catch (error) {
      console.error('Erro ao desconectar do MongoDB:', error);
      throw error;
    } finally {
      isConnected = false;
      connectionError = null;
    }
  }
}

export function getDatabaseStatus() {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    error: connectionError,
    state: mongoose.connection.readyState
  };
}

export async function tryReconnect(): Promise<boolean> {
  try {
    await disconnectFromDatabase();
    await connectToDatabase();
    return true;
  } catch (error) {
    console.error("Erro durante a reconexão:", error);
    return false;
  }
}

export async function getCollection<T>(collectionName: string) {
  if (!isConnected) {
    await connectToDatabase();
  }
  return mongoose.connection.collection<T>(collectionName);
}

// Garantir que a conexão seja fechada quando a aplicação for encerrada
process.on('SIGINT', async () => {
  await disconnectFromDatabase();
  process.exit(0);
}); 