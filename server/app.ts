/**
 * Configuração principal da aplicação Express
 * Este arquivo contém a configuração básica do servidor e conexão com o MongoDB
 */

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import accidentRoutes from './routes/accidentRoutes';
import { getDatabaseConfig, validateDatabaseConfig } from './config/database';

const app = express();

/**
 * Configuração de Middlewares Básicos
 */
app.use(cors()); // Habilita CORS para todas as origens
app.use(express.json()); // Parse de JSON no body das requisições

/**
 * Middleware de Logging
 * Registra todas as requisições com timestamp
 */
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * Configuração e Conexão com MongoDB
 */
const dbConfig = getDatabaseConfig();
validateDatabaseConfig(dbConfig);

mongoose.connect(dbConfig.uri)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

/**
 * Rota de Teste e Diagnóstico
 * Utilizada para verificar o estado da conexão com o MongoDB
 */
app.get('/api/test', async (req, res) => {
  console.log('[TEST] Rota de teste acessada');
  try {
    // Verifica o estado da conexão com o MongoDB
    const dbState = mongoose.connection.readyState;
    const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    console.log(`[TEST] Estado da conexão MongoDB: ${states[dbState]}`);
    
    // Lista todas as coleções disponíveis no banco
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`[TEST] Coleções no banco de dados: ${collectionNames.join(', ')}`);
    
    res.json({ 
      status: 'OK', 
      dbState: states[dbState], 
      collections: collectionNames
    });
  } catch (error) {
    console.error('[TEST] Erro na rota de teste:', error);
    res.status(500).json({ error: 'Erro ao acessar o MongoDB' });
  }
});

/**
 * Configuração das Rotas
 * Cada módulo de rota é responsável por um conjunto específico de funcionalidades
 */
app.use('/api/accidents', accidentRoutes);

/**
 * Middleware de Tratamento de Erros Global
 * Captura e formata todos os erros não tratados na aplicação
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

/**
 * Configuração da Porta e Inicialização do Servidor
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app; 