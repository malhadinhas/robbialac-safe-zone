"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Este script atualiza os IDs das medalhas para serem mais descritivos
 * e mantém compatibilidade com o sistema existente.
 */
async function updateMedalIds() {
    try {
        // Conectar ao banco de dados
        await (0, database_1.connectToDatabase)();
        logger_1.default.info('Conexão com o banco de dados estabelecida');
        // Obter coleções
        const medalsCollection = await (0, database_1.getCollection)('medals');
        const userMedalsCollection = await (0, database_1.getCollection)('user_medals');
        const activitiesCollection = await (0, database_1.getCollection)('user_activities');
        // Mapeamento de ID numérico para ID descritivo
        const idMapping = {
            "1": "observador-iniciante",
            "2": "vigilante-ativo",
            "3": "vigilante-dedicado",
            "4": "observador-consistente",
            "5": "guardiao-prevencao"
        };
        // Verificar se existem medalhas para atualizar
        const totalMedals = await medalsCollection.countDocuments();
        logger_1.default.info(`Total de medalhas no sistema: ${totalMedals}`);
        if (totalMedals === 0) {
            logger_1.default.warn('Nenhuma medalha encontrada para atualizar');
            process.exit(0);
            return;
        }
        // Para cada medalha no mapeamento
        for (const [oldId, newId] of Object.entries(idMapping)) {
            // Buscar a medalha pelo ID antigo
            const medal = await medalsCollection.findOne({ id: oldId });
            if (!medal) {
                logger_1.default.warn(`Medalha com ID ${oldId} não encontrada`);
                continue;
            }
            logger_1.default.info(`Atualizando medalha: ${medal.name} (${oldId} -> ${newId})`);
            // Criar uma nova medalha com o ID atualizado
            const updatedMedal = {
                ...medal,
                id: newId
            };
            delete updatedMedal._id; // Remover _id para evitar conflito
            // Usar uma operação de findOneAndUpdate com upsert: true
            // Isso evita problemas se o script for executado mais de uma vez
            const result = await medalsCollection.findOneAndUpdate({ id: newId }, { $set: updatedMedal }, { upsert: true, returnDocument: 'after' });
            // Se encontrou e atualizou uma nova medalha, remover a antiga
            if (result && result.value && oldId !== newId) {
                await medalsCollection.deleteOne({ id: oldId });
                logger_1.default.info(`Medalha antiga com ID ${oldId} removida`);
                // Atualizar referências em user_medals
                const userMedalUpdates = await userMedalsCollection.updateMany({ medalId: oldId }, { $set: { medalId: newId } });
                logger_1.default.info(`Atualizadas ${userMedalUpdates.modifiedCount} referências em user_medals`);
                // Atualizar referências em activities
                const activityUpdates = await activitiesCollection.updateMany({ activityId: oldId, category: 'medal' }, { $set: { activityId: newId } });
                logger_1.default.info(`Atualizadas ${activityUpdates.modifiedCount} referências em activities`);
            }
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
// Executar o script
updateMedalIds();
