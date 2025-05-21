"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const database_1 = require("../services/database");
const logger_1 = __importDefault(require("../utils/logger"));
async function fixVideoModel() {
    try {
        logger_1.default.info('Iniciando correção do modelo de vídeo');
        // Conectar ao banco de dados
        await (0, database_1.connectToDatabase)();
        // Remover o índice problemático
        await mongoose_1.default.connection.db.collection('videos').dropIndex('id_1');
        logger_1.default.info('Índice id_1 removido com sucesso');
        // Atualizar documentos com id nulo
        const result = await mongoose_1.default.connection.db.collection('videos').updateMany({ id: null }, { $set: { id: new mongoose_1.default.Types.ObjectId().toString() } });
        logger_1.default.info(`Documentos atualizados: ${result.modifiedCount}`);
        logger_1.default.info('Correção do modelo de vídeo concluída com sucesso');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Erro ao corrigir modelo de vídeo', { error });
        process.exit(1);
    }
}
fixVideoModel();
