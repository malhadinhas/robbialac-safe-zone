"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemConfig = void 0;
const SystemConfig_1 = __importDefault(require("../models/SystemConfig"));
const logger_1 = __importDefault(require("../utils/logger")); // Logger para registar informações e erros
// Função para buscar a configuração do sistema
const getSystemConfig = async (req, res) => {
    try {
        // Procura um documento de configuração (assume que só existe um)
        const config = await SystemConfig_1.default.findOne({}).lean();
        if (!config) {
            const defaultConfig = { annualIncidentTargetPerEmployee: 5 };
            logger_1.default.info('Usando configuração padrão do sistema');
            res.json(defaultConfig);
            return;
        }
        logger_1.default.info('Configuração do sistema recuperada com sucesso');
        res.json(config);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar configuração do sistema', { error });
        res.status(500).json({ message: 'Erro ao recuperar configuração do sistema' });
    }
};
exports.getSystemConfig = getSystemConfig;
