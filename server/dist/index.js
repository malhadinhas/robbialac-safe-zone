"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_1 = require("mongodb");
const userRoutes_1 = require("./routes/userRoutes");
const videoRoutes_1 = require("./routes/videoRoutes");
const incidentRoutes_1 = require("./routes/incidentRoutes");
const departmentRoutes_1 = require("./routes/departmentRoutes");
const medalRoutes_1 = __importDefault(require("./routes/medalRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const mongoService_1 = require("./services/mongoService");
// Carregar variáveis de ambiente
dotenv_1.default.config();
// Criar aplicação Express
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
console.log('Iniciando servidor com configurações:', {
    port,
    nodeEnv: process.env.NODE_ENV,
    mongoDbConfigured: !!process.env.MONGODB_URI
});
// Configuração básica
app.use((0, cors_1.default)());
app.use(express_1.default.json());
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
mongodb_1.MongoClient.connect(mongoUri)
    .then((client) => {
    console.log('Conectado ao MongoDB com sucesso');
    // Configurar o cliente MongoDB no serviço centralizado
    (0, mongoService_1.setMongoClient)(client);
    // Configurar todas as rotas
    app.use('/api/videos', videoRoutes_1.videoRoutes);
    app.use('/api/users', userRoutes_1.userRoutes);
    app.use('/api/incidents', incidentRoutes_1.incidentRoutes);
    app.use('/api/departments', departmentRoutes_1.departmentRoutes);
    app.use('/api/medals', medalRoutes_1.default);
    app.use('/api/stats', statsRoutes_1.default);
    // Middleware de erro
    app.use((err, req, res, next) => {
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
