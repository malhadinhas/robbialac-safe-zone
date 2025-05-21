import mongoose from 'mongoose';
import { connectToDatabase } from '../services/database';
import Video from '../models/Video';
import logger from '../utils/logger';

async function fixVideoModel() {
  try {
    logger.info('Iniciando correção do modelo de vídeo');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Remover o índice problemático
    await mongoose.connection.db.collection('videos').dropIndex('id_1');
    logger.info('Índice id_1 removido com sucesso');
    
    // Atualizar documentos com id nulo
    const result = await mongoose.connection.db.collection('videos').updateMany(
      { id: null },
      { $set: { id: new mongoose.Types.ObjectId().toString() } }
    );
    
    logger.info(`Documentos atualizados: ${result.modifiedCount}`);
    
    logger.info('Correção do modelo de vídeo concluída com sucesso');
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao corrigir modelo de vídeo', { error });
    process.exit(1);
  }
}

fixVideoModel(); 