"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const Medal_1 = __importDefault(require("../models/Medal"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Este script atualiza os IDs das medalhas para serem mais descritivos
 * e mantém compatibilidade com o sistema existente.
 */
async function updateMedalIds() {
    try {
        await (0, database_1.connectToDatabase)();
        logger_1.default.info('Conexão com o banco de dados estabelecida');
        // Mapeamento de ID numérico para ID descritivo
        const idMapping = {
            "1": "observador-iniciante",
            "2": "vigilante-ativo",
            "3": "vigilante-dedicado",
            "4": "observador-consistente",
            "5": "guardiao-prevencao"
        };
        const medals = await Medal_1.default.find({ id: { $in: Object.keys(idMapping) } });
        if (medals.length === 0) {
            logger_1.default.warn('Nenhuma medalha encontrada para atualizar');
            process.exit(0);
            return;
        }
        for (const medal of medals) {
            const oldId = medal.id;
            const newId = idMapping[oldId];
            if (!newId)
                continue;
            logger_1.default.info(`Atualizando medalha: ${medal.name} (${oldId} -> ${newId})`);
            medal.id = newId;
            await medal.save();
            logger_1.default.info(`Medalha ${medal.name} atualizada para novo ID: ${newId}`);
        }
        logger_1.default.info('Atualização de IDs de medalhas concluída com sucesso');
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar IDs de medalhas:', error);
    }
    finally {
        process.exit(0);
    }
}
updateMedalIds();
