import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import accidentRoutes from './routes/accidentRoutes';
import { getDatabaseConfig, validateDatabaseConfig } from './config/database';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware de logging para todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Conexão com o MongoDB
const dbConfig = getDatabaseConfig();
validateDatabaseConfig(dbConfig);

mongoose.connect(dbConfig.uri)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

// Rota de teste para verificar a conexão com o MongoDB
app.get('/api/test', async (req, res) => {
  console.log('[TEST] Rota de teste acessada');
  try {
    // Verificar se o MongoDB está conectado
    const dbState = mongoose.connection.readyState;
    const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
    console.log(`[TEST] Estado da conexão MongoDB: ${states[dbState]}`);
    
    // Listar coleções disponíveis
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

// Rotas
app.use('/api/accidents', accidentRoutes);

// Tratamento de erros
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

export default app; 