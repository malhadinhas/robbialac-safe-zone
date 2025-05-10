/**
 * Configuração principal da aplicação Express
 * Este arquivo contém a configuração básica do servidor e conexão com o MongoDB
 */

import express from 'express';
import mongoose from 'mongoose';
import { corsOptions, rateLimiter, helmetConfig } from './config/security';
import accidentRoutes from './routes/accidentRoutes';
import activityRoutes from './routes/activityRoutes';
import { getDatabaseConfig, validateDatabaseConfig } from './config/database';
import logger from './config/logger';
import { environment } from './config/environment';

const app = express();

/**
 * Configuração de Middlewares de Segurança
 */
app.use(helmetConfig); // Configuração de segurança HTTP
app.use(cors(corsOptions)); // Configuração de CORS
app.use(rateLimiter); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Parse de JSON com limite de tamanho

/**
 * Middleware de Logging
 * Registra todas as requisições com timestamp
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

/**
 * Configuração e Conexão com MongoDB
 */
const dbConfig = getDatabaseConfig();
validateDatabaseConfig(dbConfig);

mongoose.connect(dbConfig.uri)
  .then(() => logger.info('Conectado ao MongoDB'))
  .catch((err) => logger.error('Erro ao conectar ao MongoDB:', err));

/**
 * Rota de Teste e Diagnóstico
 * Utilizada para verificar o estado da conexão com o MongoDB
 */
app.get('/api/test', async (req, res) => {
  logger.debug('Rota de teste acessada');
  try {
    // Verifica o estado da conexão com o MongoDB
    const dbState = mongoose.connection.readyState;
    const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    logger.debug(`Estado da conexão MongoDB: ${states[dbState]}`);
    
    // Lista todas as coleções disponíveis no banco
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    logger.debug(`Coleções no banco de dados: ${collectionNames.join(', ')}`);
    
    res.json({ 
      status: 'OK', 
      dbState: states[dbState], 
      collections: collectionNames
    });
  } catch (error) {
    logger.error('Erro na rota de teste:', error);
    res.status(500).json({ error: 'Erro ao acessar o MongoDB' });
  }
});

/**
 * Configuração das Rotas
 * Cada módulo de rota é responsável por um conjunto específico de funcionalidades
 */
app.use('/api/accidents', accidentRoutes);
app.use('/api/activity', activityRoutes);

/**
 * Middleware de Tratamento de Erros Global
 * Captura e formata todos os erros não tratados na aplicação
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({ 
    error: environment.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message 
  });
});

/**
 * Configuração da Porta e Inicialização do Servidor
 */
const PORT = environment.PORT;
app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT} em modo ${environment.NODE_ENV}`);
});

export default app; 