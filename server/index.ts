import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { userRoutes } from './routes/userRoutes';
import { videoRoutes } from './routes/videoRoutes';
import { incidentRoutes } from './routes/incidentRoutes';
import { departmentRoutes } from './routes/departmentRoutes';
import { medalRoutes } from './routes/medalRoutes';
import { statsRoutes } from './routes/statsRoutes';
import { setMongoClient } from './services/mongoService';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();
const port = process.env.PORT || 3001;

console.log('Iniciando servidor com configurações:', {
  port,
  nodeEnv: process.env.NODE_ENV,
  mongoDbConfigured: !!process.env.MONGODB_URI
});

// Configuração básica
app.use(cors());
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rota básica para teste
app.get('/', (req, res) => {
  console.log('Rota raiz acessada');
  res.send('Servidor está funcionando!');
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Conectar ao MongoDB
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGODB_URI não definida nas variáveis de ambiente');
}

MongoClient.connect(mongoUri)
  .then((client) => {
    console.log('Conectado ao MongoDB com sucesso');
    
    // Configurar o cliente MongoDB no serviço centralizado
    setMongoClient(client);
    
    // Configurar todas as rotas
    app.use('/api/videos', videoRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/incidents', incidentRoutes);
    app.use('/api/departments', departmentRoutes);
    app.use('/api/medals', medalRoutes);
    app.use('/api/stats', statsRoutes);
    
    // Middleware de erro
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Erro interno do servidor' });
    });
    
    // Iniciar servidor
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 