import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { connectToDatabase, getDatabaseStatus } from './services/database';
import incidentRoutes from './routes/incidents';
import videoRoutes from './routes/videos';
import secureUrlRoutes from './routes/secureUrlRoutes';
import departmentRoutes from './routes/departments';
import medalRoutes from './routes/medals';
import zoneRoutes from './routes/zones';
import statsRoutes from './routes/statsRoutes';
import activityRoutes from './routes/activityRoutes';
import logger from './utils/logger';
import { ensureStorageDirectories } from './config/storage';
import { checkStorage } from './scripts/checkStorage';

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

// Configurações de segurança
app.use(helmet());
app.use(cors());

// Aumentar limite de payload para 10GB
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));

// Servir arquivos estáticos do diretório temp
app.use('/videos', express.static(TEMP_DIR));

// Verificar configuração de armazenamento
checkStorage().catch(error => {
  logger.error('Erro na verificação de armazenamento', { error });
  process.exit(1);
});

// Middleware para tratar erros
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Erro no servidor', { error: err.message, stack: err.stack });
  res.status(500).json({ error: err.message });
});

// Rotas da API
app.use('/api/incidents', incidentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/secure-url', secureUrlRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medals', medalRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/activities', activityRoutes);

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