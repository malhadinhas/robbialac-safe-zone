"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectMongoose = connectMongoose;
exports.disconnectMongoose = disconnectMongoose;
/**
 * @module server/config/mongoose
 * @description Este módulo gerencia a conexão com o MongoDB usando a biblioteca Mongoose.
 * É responsável por estabelecer a conexão inicial, monitorar o estado da conexão
 * (erros, desconexões) e garantir um desligamento adequado ao encerrar o processo.
 */
const mongoose_1 = __importDefault(require("mongoose"));
// Importa a função para obter a configuração do banco de dados do módulo vizinho.
const database_1 = require("./database");
/**
 * @function connectMongoose
 * @description Estabelece a conexão principal com o MongoDB usando Mongoose.
 * Utiliza a URI e o dbName definidos na configuração do banco de dados.
 * Em caso de sucesso, loga uma mensagem. Em caso de falha, loga o erro e o relança,
 * o que geralmente interrompe a inicialização do servidor se a conexão falhar.
 * @returns {Promise<void>} Uma Promise que resolve quando a conexão é estabelecida.
 * @throws {Error} Se a conexão com o MongoDB falhar.
 */
async function connectMongoose() {
    try {
        // Obtém a configuração do banco de dados (URI e dbName).
        const dbConfig = (0, database_1.getDatabaseConfig)();
        // Tenta conectar ao MongoDB usando a URI e especificando o nome do banco de dados.
        await mongoose_1.default.connect(dbConfig.uri, {
            dbName: dbConfig.dbName
        });
        // Loga sucesso indicando o nome do banco de dados conectado.
        console.log(`Mongoose conectado ao MongoDB: ${dbConfig.dbName}`);
    }
    catch (error) {
        // Loga o erro detalhado caso a conexão falhe.
        console.error('Erro ao conectar o Mongoose:', error);
        // Relança o erro para sinalizar falha na inicialização da aplicação.
        throw error;
    }
}
/**
 * Listener para erros na conexão do Mongoose que ocorrem *após* a conexão inicial.
 * Útil para monitorar problemas de conectividade durante a execução da aplicação.
 */
mongoose_1.default.connection.on('error', (error) => {
    console.error('Erro na conexão do Mongoose (após conexão inicial):', error);
});
/**
 * Listener para o evento de desconexão do Mongoose.
 * Loga um aviso para indicar que a aplicação perdeu a conexão com o banco de dados.
 */
mongoose_1.default.connection.on('disconnected', () => {
    console.warn('Mongoose desconectado do MongoDB');
});
/**
 * Listener para o sinal SIGINT do processo (geralmente Ctrl+C no terminal).
 * Garante que a conexão com o MongoDB seja fechada de forma limpa ('graceful shutdown')
 * antes que o processo Node.js termine, evitando perda de dados ou conexões penduradas.
 */
process.on('SIGINT', async () => {
    try {
        // Tenta fechar a conexão Mongoose de forma assíncrona.
        await mongoose_1.default.connection.close();
        console.log('Conexão do Mongoose fechada por término do processo (SIGINT)');
        // Encerra o processo Node.js com código 0 (sucesso).
        process.exit(0);
    }
    catch (error) {
        // Loga um erro se não for possível fechar a conexão.
        console.error('Erro ao fechar conexão do Mongoose durante SIGINT:', error);
        // Encerra o processo Node.js com código 1 (erro).
        process.exit(1);
    }
});
/**
 * @function disconnectMongoose
 * @description Desconecta explicitamente a instância do Mongoose do MongoDB.
 * Função útil para cenários de teste ou para desligamentos controlados específicos da aplicação.
 * @returns {Promise<void>} Uma Promise que resolve quando a desconexão é concluída.
 * @throws {Error} Se ocorrer um erro durante a tentativa de desconexão.
 */
async function disconnectMongoose() {
    try {
        // Chama o método de desconexão do Mongoose.
        await mongoose_1.default.disconnect();
        console.log('Mongoose desconectado com sucesso');
    }
    catch (error) {
        // Loga e relança o erro se a desconexão falhar.
        console.error('Erro ao desconectar o Mongoose:', error);
        throw error;
    }
}
