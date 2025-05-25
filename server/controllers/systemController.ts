import { Request, Response } from 'express'; // Importa os tipos do Express para tipar as funções de request e response
import SystemConfig from '../models/SystemConfig';
import logger from '../utils/logger'; // Logger para registar informações e erros

// Interface que define a estrutura da configuração do sistema
interface SystemConfig {
  annualIncidentTargetPerEmployee: number; // Meta anual de incidentes por colaborador
}

// Função para buscar a configuração do sistema
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    // Procura um documento de configuração (assume que só existe um)
    const config = await SystemConfig.findOne({}).lean();
    if (!config) {
      const defaultConfig = { annualIncidentTargetPerEmployee: 5 };
      logger.info('Usando configuração padrão do sistema');
      res.json(defaultConfig);
      return;
    }
    logger.info('Configuração do sistema recuperada com sucesso');
    res.json(config);
  } catch (error) {
    logger.error('Erro ao recuperar configuração do sistema', { error });
    res.status(500).json({ message: 'Erro ao recuperar configuração do sistema' });
  }
}; 