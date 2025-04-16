import 'dotenv/config';
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
import systemRoutes from './routes/system';
import accidentRoutes from './routes/accidentRoutes';
import { ensureStorageDirectories } from './config/storage';
import { checkStorage } from './scripts/checkStorage';
import logger from './utils/logger';

// Verificar variáveis de ambiente críticas
logger.info('Verificando variáveis de ambiente...');
const requiredEnvVars = [
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error('Variáveis de ambiente ausentes:', { missingVars });
  throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
}

logger.info('Variáveis de ambiente carregadas:', {
  hasEndpoint: !!process.env.R2_ENDPOINT,
  hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
  hasBucket: !!process.env.R2_BUCKET_NAME
});

const app = express();
const port = 3000;

// Diretório para arquivos temporários
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Configurações de segurança
app.use(helmet());
app.use(cors());

// Aumentar limite de payload para 10GB
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));

// Servir arquivos estáticos do diretório temp
app.use('/videos', express.static(TEMP_DIR));

// Em desenvolvimento, servir arquivos temporários
if (process.env.NODE_ENV === 'development') {
  const TEMP_STORAGE_DIR = path.join(process.cwd(), 'storage', 'temp');
  app.use('/temp', express.static(TEMP_STORAGE_DIR));
  logger.info('Modo de desenvolvimento - Servindo arquivos temporários de:', TEMP_STORAGE_DIR);
}

// Verificar configuração de armazenamento
checkStorage().catch(error => {
  throw new Error(`Erro na verificação de armazenamento: ${error.message}`);
});

// Middleware para tratar erros
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({ error: err.message });
});

// Rotas da API
app.use('/api/accidents', accidentRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/secure-url', secureUrlRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/medals', medalRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/system', systemRoutes);

// Rota para verificar status do banco
app.get('/api/database/status', (req, res) => {
  const status = getDatabaseStatus();
  res.json(status);
});

// Inicializa o servidor
connectToDatabase().then(() => {
  app.listen(port, () => {
    // Mantido apenas o log essencial de inicialização do servidor
    console.info(`Servidor rodando em http://localhost:${port}`);
  });
}).catch(error => {
  throw new Error(`Erro ao iniciar o servidor: ${error.message}`);
}); 