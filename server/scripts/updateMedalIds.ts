import { connectToDatabase } from '../services/database';
import Medal from '../models/Medal';
import logger from '../utils/logger';

/**
 * Este script atualiza os IDs das medalhas para serem mais descritivos
 * e mantém compatibilidade com o sistema existente.
 */
async function updateMedalIds() {
  try {
    await connectToDatabase();
    logger.info('Conexão com o banco de dados estabelecida');

    // Mapeamento de ID numérico para ID descritivo
    const idMapping: Record<string, string> = {
      "1": "observador-iniciante",
      "2": "vigilante-ativo",
      "3": "vigilante-dedicado",
      "4": "observador-consistente",
      "5": "guardiao-prevencao"
    };

    const medals = await Medal.find({ id: { $in: Object.keys(idMapping) } });
    if (medals.length === 0) {
      logger.warn('Nenhuma medalha encontrada para atualizar');
      process.exit(0);
      return;
    }

    for (const medal of medals) {
      const oldId = medal.id;
      const newId = idMapping[oldId];
      if (!newId) continue;
      logger.info(`Atualizando medalha: ${medal.name} (${oldId} -> ${newId})`);
      medal.id = newId;
      await medal.save();
      logger.info(`Medalha ${medal.name} atualizada para novo ID: ${newId}`);
    }

    logger.info('Atualização de IDs de medalhas concluída com sucesso');
  } catch (error) {
    logger.error('Erro ao atualizar IDs de medalhas:', error);
  } finally {
    process.exit(0);
  }
}

updateMedalIds(); 