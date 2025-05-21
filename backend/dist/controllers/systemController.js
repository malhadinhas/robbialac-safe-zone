"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemConfig = void 0;
const database_1 = require("../services/database"); // Função para obter uma coleção da base de dados
const logger_1 = __importDefault(require("../utils/logger")); // Logger para registar informações e erros
// Função para buscar a configuração do sistema
const getSystemConfig = async (req, res) => {
    try {
        // Obtém a coleção 'system_config' da base de dados
        const collection = await (0, database_1.getCollection)('system_config');
        // Procura um documento de configuração (assume que só existe um)
        const config = await collection.findOne({});
        if (!config) {
            // Se não existir configuração, retorna um valor padrão
            const defaultConfig = { annualIncidentTargetPerEmployee: 5 };
            logger_1.default.info('Usando configuração padrão do sistema');
            return res.json(defaultConfig);
        }
        // Se encontrou configuração, retorna-a
        logger_1.default.info('Configuração do sistema recuperada com sucesso');
        res.json(config);
    }
    catch (error) {
        // Em caso de erro, regista e devolve erro 500
        logger_1.default.error('Erro ao recuperar configuração do sistema', { error });
        res.status(500).json({ message: 'Erro ao recuperar configuração do sistema' });
    }
};
exports.getSystemConfig = getSystemConfig;
