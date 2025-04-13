import mongoose from 'mongoose';
import { MongoDBConfig } from '../../src/config/database';

export async function connectMongoose() {
  try {
    await mongoose.connect(MongoDBConfig.uri);
    console.log('Mongoose conectado ao MongoDB Atlas');
  } catch (error) {
    console.error('Erro ao conectar o Mongoose:', error);
    throw error;
  }
}

mongoose.connection.on('error', (error) => {
  console.error('Erro na conexão do Mongoose:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose desconectado do MongoDB');
});

process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Conexão do Mongoose fechada por término do processo');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao fechar conexão do Mongoose:', error);
    process.exit(1);
  }
});

export async function disconnectMongoose(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('Mongoose desconectado com sucesso');
  } catch (error) {
    console.error('Erro ao desconectar o Mongoose:', error);
    throw error;
  }
} 