"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
exports.getDatabaseStatus = getDatabaseStatus;
exports.tryReconnect = tryReconnect;
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../config/database");
let isConnected = false;
let connectionError = null;
async function connectToDatabase() {
    console.log('=== Iniciando conexão com o banco de dados ===');
    console.log('MONGODB_URI do process.env:', process.env.MONGODB_URI);
    const dbConfig = (0, database_1.getDatabaseConfig)();
    const uri = dbConfig.uri;
    // Se já estiver conectado, não faz nada
    if (isConnected && mongoose_1.default.connection.readyState === 1) {
        console.log('Já conectado ao banco de dados');
        return;
    }
    try {
        console.log('URI usada na conexão:', uri);
        console.log('DB usado na conexão:', dbConfig.dbName);
        console.log('Configuração carregada:', {
            dbName: dbConfig.dbName,
            uriPrefix: uri.substring(0, 20) + '...'
        });
        // Configurar Mongoose
        mongoose_1.default.set('strictQuery', true);
        console.log('Conectando ao MongoDB via Mongoose...');
        await mongoose_1.default.connect(uri, {
            dbName: dbConfig.dbName,
        });
        console.log('=== Conectado ao MongoDB com sucesso ===');
        isConnected = true;
        connectionError = null;
        // Eventos de conexão
        mongoose_1.default.connection.on('error', (err) => {
            console.error('Erro na conexão MongoDB:', err);
            isConnected = false;
            connectionError = err.message;
        });
        mongoose_1.default.connection.on('disconnected', () => {
            console.log('Desconectado do MongoDB');
            isConnected = false;
        });
    }
    catch (error) {
        console.error('=== Erro ao conectar ao MongoDB ===');
        console.error('Detalhes do erro:', error);
        isConnected = false;
        connectionError = error instanceof Error ? error.message : "Erro desconhecido";
        throw error;
    }
}
async function disconnectFromDatabase() {
    if (mongoose_1.default.connection.readyState !== 0) {
        try {
            await mongoose_1.default.disconnect();
            console.log('Desconectado do MongoDB com sucesso');
        }
        catch (error) {
            console.error('Erro ao desconectar do MongoDB:', error);
            throw error;
        }
        finally {
            isConnected = false;
            connectionError = null;
        }
    }
}
function getDatabaseStatus() {
    return {
        connected: isConnected && mongoose_1.default.connection.readyState === 1,
        error: connectionError,
        state: mongoose_1.default.connection.readyState
    };
}
async function tryReconnect() {
    try {
        await disconnectFromDatabase();
        await connectToDatabase();
        return true;
    }
    catch (error) {
        console.error("Erro durante a reconexão:", error);
        return false;
    }
}
// Garantir que a conexão seja fechada quando a aplicação for encerrada
process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    process.exit(0);
});
