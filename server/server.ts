import express from 'express';
import cors from 'cors';
import { connectToDatabase, getDatabaseStatus } from './services/database';
import incidentRoutes from './routes/incidents';
import videoRoutes from './routes/videos';
import departmentRoutes from './routes/departments';
import medalRoutes from './routes/medals';
import zoneRoutes from './routes/zones';
import logger from './utils/logger';

const app = express();
const port = 3000;

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  logger.info('Nova requisição', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

app.use(cors());
app.use(express.json());

// Middleware para tratar erros
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Erro no servidor', { error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

// Rotas da API
app.use('/api/incidents', incidentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medals', medalRoutes);
app.use('/api/zones', zoneRoutes);

// Rota para verificar status do banco
app.get('/api/database/status', (req, res) => {
  const status = getDatabaseStatus();
  res.json(status);
});

// Inicializa o servidor
connectToDatabase().then(() => {
  app.listen(port, () => {
    logger.info(`Servidor rodando em http://localhost:${port}`);
  });
}).catch(error => {
  logger.error('Erro ao iniciar o servidor:', { error });
}); 