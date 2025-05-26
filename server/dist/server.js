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
const checkStorage_1 = require("./scripts/checkStorage");
const logger_1 = __importDefault(require("./utils/logger"));
const cors_1 = __importDefault(require("./config/cors"));
const fileAccessMiddleware_1 = __importDefault(require("./middleware/fileAccessMiddleware"));
const routes_1 = __importDefault(require("./routes"));
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
const port = Number(process.env.PORT) || 3000;
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
    logger_1.default.error('Erro não tratado:', { error: err });
    res.status(500).json({ message: 'Erro interno do servidor' });
});
/**
 * Configuração das rotas da API
 * Cada rota é modularizada em seu próprio arquivo
 */
app.use('/api', routes_1.default);
/**
 * Rota de diagnóstico para verificar status do banco de dados
 */
app.get('/api/database/status', (req, res) => {
    const status = (0, database_1.getDatabaseStatus)();
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
const startServer = async () => {
    try {
        await (0, database_1.connectToDatabase)();
        app.listen(port, '0.0.0.0', () => {
            logger_1.default.info(`Servidor rodando em http://0.0.0.0:${port}`);
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao iniciar servidor:', { error });
        process.exit(1);
    }
};
startServer();
// Mantém o processo vivo para debug no Railway (remover depois)
setInterval(() => { }, 1000 * 60 * 60);
