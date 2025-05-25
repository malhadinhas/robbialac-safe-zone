/**
 * Servidor principal da aplicação Robbialac Safe Zone
 * Este arquivo configura e inicializa o servidor Express com todas as suas dependências
 */

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
import sensibilizacaoRoutes from './routes/sensibilizacaoRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import authRoutes from './routes/authRoutes';
import { hashPassword } from './services/auth';
import interactionRoutes from './routes/interactionRoutes';
import corsMiddleware from './config/cors';
import fileAccessMiddleware from './middleware/fileAccessMiddleware';
import uploadsRoutes from './routes/uploads';
import usersRoutes from './routes/users';
import { Request, Response, NextFunction } from 'express';

/**
 * Verificação das variáveis de ambiente necessárias para o Cloudflare R2
 * Estas variáveis são críticas para o funcionamento do armazenamento de arquivos
 */
logger.info('Verificando variáveis de ambiente...');
const requiredEnvVars = [
  'R2_ENDPOINT',      // Endpoint do serviço R2
  'R2_ACCESS_KEY_ID', // Chave de acesso
  'R2_SECRET_ACCESS_KEY', // Chave secreta
  'R2_BUCKET_NAME'    // Nome do bucket
];

// Verifica se alguma variável está faltando
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  logger.error('Variáveis de ambiente ausentes:', { missingVars });
  throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
}

// Log de confirmação das variáveis carregadas
logger.info('Variáveis de ambiente carregadas:', {
  hasEndpoint: !!process.env.R2_ENDPOINT,
  hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
  hasBucket: !!process.env.R2_BUCKET_NAME
});

const app = express();
const port = Number(process.env.PORT) || 3000;

/**
 * Configuração de diretórios e middlewares
 */
// Diretório para arquivos temporários
const TEMP_DIR = path.join(process.cwd(), 'temp');

// Configurações de segurança
app.use(helmet());
app.use(corsMiddleware);

/**
 * Configuração de limites de upload
 * Aumentado para 10GB para suportar uploads de vídeos grandes
 */
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ limit: '10gb', extended: true }));

// Servir arquivos estáticos do diretório temp com proteção
app.use('/videos', fileAccessMiddleware, express.static(TEMP_DIR));

/**
 * Configuração específica para ambiente de desenvolvimento
 * Permite acesso a arquivos temporários para debug
 */
if (process.env.NODE_ENV === 'development') {
  const TEMP_STORAGE_DIR = path.join(process.cwd(), 'storage', 'temp');
  app.use('/temp', fileAccessMiddleware, express.static(TEMP_STORAGE_DIR));
  logger.info('Modo de desenvolvimento - Servindo arquivos temporários de:', TEMP_STORAGE_DIR);
}

// Verificar configuração de armazenamento
checkStorage().catch(error => {
  throw new Error(`Erro na verificação de armazenamento: ${error.message}`);
});

/**
 * Middleware global de tratamento de erros
 * Captura e formata todos os erros não tratados
 */
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message });
});

/**
 * Configuração das rotas da API
 * Cada rota é modularizada em seu próprio arquivo
 */
app.use('/api/auth', authRoutes);
app.use('/api/accidents', accidentRoutes);     // Gestão de acidentes
app.use('/api/incidents', incidentRoutes);     // Gestão de incidentes
app.use('/api/videos', videoRoutes);           // Gestão de vídeos
app.use('/api/secure-url', secureUrlRoutes);   // URLs seguras
app.use('/api/departments', departmentRoutes); // Gestão de departamentos
app.use('/api/medals', medalRoutes);           // Sistema de gamificação
app.use('/api/zones', zoneRoutes);            // Gestão de zonas
app.use('/api/stats', statsRoutes);           // Estatísticas
app.use('/api/activities', activityRoutes);   // Registro de atividades
app.use('/api/system', systemRoutes);         // Configurações do sistema
app.use('/api/sensibilizacao', sensibilizacaoRoutes); // Gestão de sensibilização
app.use('/api/analytics', analyticsRoutes); // Adiciona as rotas de analytics
app.use('/api/interactions', interactionRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/users', usersRoutes);

/**
 * Rota de diagnóstico para verificar status do banco de dados
 */
app.get('/api/database/status', (req, res) => {
  const status = getDatabaseStatus();
  res.json(status);
});

app.get('/api/health', (req, res) => {
  console.log('Health check called');
  res.json({ status: 'ok' });
});

/**
 * Inicialização do servidor
 * Conecta ao banco de dados antes de iniciar o servidor
 */
console.log('Início do server/server.ts');
connectToDatabase().then(() => {
  console.log('Antes do app.listen');
  app.listen(port, '0.0.0.0', () => {
    logger.info(`Servidor rodando em http://0.0.0.0:${port}`);
    console.log('Depois do app.listen');
  });
}).catch(error => {
  console.error('Erro no connectToDatabase:', error);
  throw new Error(`Erro ao iniciar o servidor: ${error.message}`);
});

// Mantém o processo vivo para debug no Railway (remover depois)
setInterval(() => {}, 1000 * 60 * 60); 