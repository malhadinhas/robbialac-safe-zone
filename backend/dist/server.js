"use strict";
/**
 * Servidor principal da aplicação Robbialac Safe Zone
 * Este arquivo configura e inicializa o servidor Express com todas as suas dependências
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./services/database");
const incidents_1 = __importDefault(require("./routes/incidents"));
const videos_1 = __importDefault(require("./routes/videos"));
const secureUrlRoutes_1 = __importDefault(require("./routes/secureUrlRoutes"));
const departments_1 = __importDefault(require("./routes/departments"));
const medals_1 = __importDefault(require("./routes/medals"));
const zones_1 = __importDefault(require("./routes/zones"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const system_1 = __importDefault(require("./routes/system"));
const accidentRoutes_1 = __importDefault(require("./routes/accidentRoutes"));
const checkStorage_1 = require("./scripts/checkStorage");
const logger_1 = __importDefault(require("./utils/logger"));
const sensibilizacaoRoutes_1 = __importDefault(require("./routes/sensibilizacaoRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const interactionRoutes_1 = __importDefault(require("./routes/interactionRoutes"));
const cors_1 = __importDefault(require("./config/cors"));
const fileAccessMiddleware_1 = __importDefault(require("./middleware/fileAccessMiddleware"));
const uploads_1 = __importDefault(require("./routes/uploads"));
const users_1 = __importDefault(require("./routes/users"));
/**
 * Verificação das variáveis de ambiente necessárias para o Cloudflare R2
 * Estas variáveis são críticas para o funcionamento do armazenamento de arquivos
 */
logger_1.default.info('Verificando variáveis de ambiente...');
const requiredEnvVars = [
    'R2_ENDPOINT', // Endpoint do serviço R2
    'R2_ACCESS_KEY_ID', // Chave de acesso
    'R2_SECRET_ACCESS_KEY', // Chave secreta
    'R2_BUCKET_NAME' // Nome do bucket
];
// Verifica se alguma variável está faltando
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    logger_1.default.error('Variáveis de ambiente ausentes:', { missingVars });
    throw new Error(`Variáveis de ambiente ausentes: ${missingVars.join(', ')}`);
}
// Log de confirmação das variáveis carregadas
logger_1.default.info('Variáveis de ambiente carregadas:', {
    hasEndpoint: !!process.env.R2_ENDPOINT,
    hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
    hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
    hasBucket: !!process.env.R2_BUCKET_NAME
});
const app = (0, express_1.default)();
const port = 3000;
/**
 * Configuração de diretórios e middlewares
 */
// Diretório para arquivos temporários
const TEMP_DIR = path_1.default.join(process.cwd(), 'temp');
// Configurações de segurança
app.use((0, helmet_1.default)());
app.use(cors_1.default);
/**
 * Configuração de limites de upload
 * Aumentado para 10GB para suportar uploads de vídeos grandes
 */
app.use(express_1.default.json({ limit: '10gb' }));
app.use(express_1.default.urlencoded({ limit: '10gb', extended: true }));
// Servir arquivos estáticos do diretório temp com proteção
app.use('/videos', fileAccessMiddleware_1.default, express_1.default.static(TEMP_DIR));
/**
 * Configuração específica para ambiente de desenvolvimento
 * Permite acesso a arquivos temporários para debug
 */
if (process.env.NODE_ENV === 'development') {
    const TEMP_STORAGE_DIR = path_1.default.join(process.cwd(), 'storage', 'temp');
    app.use('/temp', fileAccessMiddleware_1.default, express_1.default.static(TEMP_STORAGE_DIR));
    logger_1.default.info('Modo de desenvolvimento - Servindo arquivos temporários de:', TEMP_STORAGE_DIR);
}
// Verificar configuração de armazenamento
(0, checkStorage_1.checkStorage)().catch(error => {
    throw new Error(`Erro na verificação de armazenamento: ${error.message}`);
});
/**
 * Middleware global de tratamento de erros
 * Captura e formata todos os erros não tratados
 */
app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
});
/**
 * Configuração das rotas da API
 * Cada rota é modularizada em seu próprio arquivo
 */
app.use('/api/auth', authRoutes_1.default);
app.use('/api/accidents', accidentRoutes_1.default); // Gestão de acidentes
app.use('/api/incidents', incidents_1.default); // Gestão de incidentes
app.use('/api/videos', videos_1.default); // Gestão de vídeos
app.use('/api/secure-url', secureUrlRoutes_1.default); // URLs seguras
app.use('/api/departments', departments_1.default); // Gestão de departamentos
app.use('/api/medals', medals_1.default); // Sistema de gamificação
app.use('/api/zones', zones_1.default); // Gestão de zonas
app.use('/api/stats', statsRoutes_1.default); // Estatísticas
app.use('/api/activities', activityRoutes_1.default); // Registro de atividades
app.use('/api/system', system_1.default); // Configurações do sistema
app.use('/api/sensibilizacao', sensibilizacaoRoutes_1.default); // Gestão de sensibilização
app.use('/api/analytics', analyticsRoutes_1.default); // Adiciona as rotas de analytics
app.use('/api/interactions', interactionRoutes_1.default);
app.use('/api/uploads', uploads_1.default);
app.use('/api/users', users_1.default);
/**
 * Rota de diagnóstico para verificar status do banco de dados
 */
app.get('/api/database/status', (req, res) => {
    const status = (0, database_1.getDatabaseStatus)();
    res.json(status);
});
/**
 * Inicialização do servidor
 * Conecta ao banco de dados antes de iniciar o servidor
 */
(0, database_1.connectToDatabase)().then(() => {
    app.listen(port, '0.0.0.0', () => {
        logger_1.default.info(`Servidor rodando em http://0.0.0.0:${port}`);
    });
}).catch(error => {
    throw new Error(`Erro ao iniciar o servidor: ${error.message}`);
});
