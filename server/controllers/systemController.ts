import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

interface SystemConfig {
  annualIncidentTargetPerEmployee: number;
}

// Buscar configuração do sistema
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<SystemConfig>('system_config');
    const config = await collection.findOne({});
    
    if (!config) {
      // Se não existir configuração, retorna o valor padrão
      const defaultConfig = { annualIncidentTargetPerEmployee: 5 };
      logger.info('Usando configuração padrão do sistema');
      return res.json(defaultConfig);
    }
    
    logger.info('Configuração do sistema recuperada com sucesso');
    res.json(config);
  } catch (error) {
    logger.error('Erro ao recuperar configuração do sistema', { error });
    res.status(500).json({ message: 'Erro ao recuperar configuração do sistema' });
  }
}; 