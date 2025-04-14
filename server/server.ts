import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { connectToDatabase, getDatabaseStatus } from './services/database';
import incidentRoutes from './routes/incidents';
import videoRoutes from './routes/videos';
import departmentRoutes from './routes/departments';
import medalRoutes from './routes/medals';
import zoneRoutes from './routes/zones';
import statsRoutes from './routes/statsRoutes';
import activityRoutes from './routes/activityRoutes';
import logger from './utils/logger';
import authRoutes from './routes/authRoutes';

const app = express();
const port = 3000;

// Diretório para arquivos temporários
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  logger.info('Nova requisição', {
    method: req.method,
    url: req.url,
    ip: req.ip
  });
  next();
});

// Aumentar limite de tamanho do corpo da requisição para 50MB
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configurações de segurança e CORS
app.use(helmet());
app.use(cors());

// Servir arquivos estáticos do diretório temp
app.use('/videos', express.static(TEMP_DIR));

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

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
app.use('/api/stats', statsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/auth', authRoutes);

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