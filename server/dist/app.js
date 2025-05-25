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
const cors_1 = __importDefault(require("cors"));
const accidentRoutes_1 = __importDefault(require("./routes/accidentRoutes"));
const activityRoutes_1 = __importDefault(require("./routes/activityRoutes"));
const videos_1 = __importDefault(require("./routes/videos"));
const incidents_1 = __importDefault(require("./routes/incidents"));
const database_1 = require("./config/database");
const app = (0, express_1.default)();
/**
 * Configuração de Middlewares Básicos
 */
app.use((0, cors_1.default)()); // Habilita CORS para todas as origens
app.use(express_1.default.json()); // Parse de JSON no body das requisições
/**
 * Middleware de Logging
 * Registra todas as requisições com timestamp
 */
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
/**
 * Configuração e Conexão com MongoDB
 */
const dbConfig = (0, database_1.getDatabaseConfig)();
(0, database_1.validateDatabaseConfig)(dbConfig);
mongoose_1.default.connect(dbConfig.uri)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch((err) => console.error('Erro ao conectar ao MongoDB:', err));
/**
 * Rota de Teste e Diagnóstico
 * Utilizada para verificar o estado da conexão com o MongoDB
 */
app.get('/api/test', async (req, res) => {
    console.log('[TEST] Rota de teste acessada');
    try {
        // Verifica o estado da conexão com o MongoDB
        const dbState = mongoose_1.default.connection.readyState;
        const states = ['desconectado', 'conectado', 'conectando', 'desconectando'];
        console.log(`[TEST] Estado da conexão MongoDB: ${states[dbState]}`);
        // Lista todas as coleções disponíveis no banco
        const collections = await mongoose_1.default.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log(`[TEST] Coleções no banco de dados: ${collectionNames.join(', ')}`);
        res.json({
            status: 'OK',
            dbState: states[dbState],
            collections: collectionNames
        });
    }
    catch (error) {
        console.error('[TEST] Erro na rota de teste:', error);
        res.status(500).json({ error: 'Erro ao acessar o MongoDB' });
    }
});
/**
 * Configuração das Rotas
 * Cada módulo de rota é responsável por um conjunto específico de funcionalidades
 */
app.use('/api/accidents', accidentRoutes_1.default);
app.use('/api/videos', videos_1.default);
app.use('/api/incidents', incidents_1.default);
app.use('/api/activities', activityRoutes_1.default);
/**
 * Middleware de Tratamento de Erros Global
 * Captura e formata todos os erros não tratados na aplicação
 */
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});
/**
 * Configuração da Porta e Inicialização do Servidor
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
exports.default = app;
