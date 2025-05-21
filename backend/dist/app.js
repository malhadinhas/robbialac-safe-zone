"use strict";
/**
 * Configuração principal da aplicação Express
 * Este arquivo contém a configuração básica do servidor e conexão com o MongoDB
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const security_1 = require("./config/security");
const cors_1 = __importDefault(require("./config/cors"));
const accidentRoutes_1 = __importDefault(require("./routes/accidentRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const database_1 = require("./config/database");
const logger_1 = __importDefault(require("./config/logger"));
const environment_1 = require("./config/environment");
const app = (0, express_1.default)();
/**
 * Configuração de Middlewares de Segurança
 */
app.use(security_1.helmetConfig); // Configuração de segurança HTTP
app.use(cors_1.default); // Configuração de CORS centralizada
app.use(security_1.rateLimiter); // Rate limiting
app.use(express_1.default.json({ limit: '10mb' })); // Parse de JSON com limite de tamanho
/**
 * Middleware de Logging
 * Registra todas as requisições com timestamp
 */
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.url}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        timestamp: new Date().toISOString()
    });
    next();
});
/**
 * Configuração e Conexão com MongoDB
 */
const dbConfig = (0, database_1.getDatabaseConfig)();
(0, database_1.validateDatabaseConfig)(dbConfig);
mongoose_1.default.connect(dbConfig.uri)
    .then(() => logger_1.default.info('Conectado ao MongoDB'))
    .catch((err) => logger_1.default.error('Erro ao conectar ao MongoDB:', err));
/**
 * Rota de Teste e Diagnóstico
 * Utilizada para verificar o estado da conexão com o MongoDB
 */
app.get('/api/test', async (req, res) => {
    logger_1.default.debug('Rota de teste acessada');
    try {
        // Verifica o estado da conexão com o MongoDB
        const dbState = mongoose_1.default.connection.readyState;
        const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
        logger_1.default.debug(`Estado da conexão MongoDB: ${states[dbState]}`);
        // Lista todas as coleções disponíveis no banco
        if (!mongoose_1.default.connection.db) {
            logger_1.default.error('mongoose.connection.db está undefined');
            return res.status(500).json({ error: 'Conexão com o banco de dados não está disponível.' });
        }
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        logger_1.default.debug(`Coleções no banco de dados: ${collectionNames.join(', ')}`);
        res.json({
            status: 'OK',
            dbState: states[dbState],
            collections: collectionNames
        });
    }
    catch (error) {
        logger_1.default.error('Erro na rota de teste:', error);
        res.status(500).json({ error: 'Erro ao acessar o MongoDB' });
    }
});
/**
 * Configuração das Rotas
 * Cada módulo de rota é responsável por um conjunto específico de funcionalidades
 */
app.use('/api/accidents', accidentRoutes_1.default);
app.use('/api/activity', activityRoutes_1.default);
/**
 * Middleware de Tratamento de Erros Global
 * Captura e formata todos os erros não tratados na aplicação
 */
app.use((err, req, res, next) => {
    logger_1.default.error('Erro não tratado:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        error: environment_1.environment.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : err.message
    });
});
/**
 * Configuração da Porta e Inicialização do Servidor
 */
const PORT = environment_1.environment.PORT;
app.listen(PORT, () => {
    logger_1.default.info(`Servidor rodando na porta ${PORT} em modo ${environment_1.environment.NODE_ENV}`);
});
exports.default = app;
