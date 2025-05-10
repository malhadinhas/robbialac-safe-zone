import { Request, Response } from 'express'; // Importa os tipos do Express para tipar as funções de request e response
import { getCollection } from '../services/database'; // Função para obter uma coleção da base de dados
import logger from '../utils/logger'; // Logger para registar informações e erros

// Interface que define a estrutura da configuração do sistema
interface SystemConfig {
  annualIncidentTargetPerEmployee: number; // Meta anual de incidentes por colaborador
}

// Função para buscar a configuração do sistema
export const getSystemConfig = async (req: Request, res: Response) => {
  try {
    // Obtém a coleção 'system_config' da base de dados
    const collection = await getCollection<SystemConfig>('system_config');
    // Procura um documento de configuração (assume que só existe um)
    const config = await collection.findOne({});
    
    if (!config) {
      // Se não existir configuração, retorna um valor padrão
      const defaultConfig = { annualIncidentTargetPerEmployee: 5 };
      logger.info('Usando configuração padrão do sistema');
      return res.json(defaultConfig);
    }
    
    // Se encontrou configuração, retorna-a
    logger.info('Configuração do sistema recuperada com sucesso');
    res.json(config);
  } catch (error) {
    // Em caso de erro, regista e devolve erro 500
    logger.error('Erro ao recuperar configuração do sistema', { error });
    res.status(500).json({ message: 'Erro ao recuperar configuração do sistema' });
  }
}; 