import { connectToDatabase } from '../services/database';
import Incident from '../models/Incident';
import logger from '../utils/logger';

const initialIncidents = [
  {
    department: 'Produção',
    description: 'Quase acidente com empilhadeira',
    date: new Date('2024-03-01'),
    status: 'closed',
    severity: 'high'
  },
  {
    department: 'Produção',
    description: 'Derramamento de produto químico',
    date: new Date('2024-03-05'),
    status: 'closed',
    severity: 'medium'
  },
  {
    department: 'Manutenção',
    description: 'Ferramenta solta em altura',
    date: new Date('2024-03-02'),
    status: 'closed',
    severity: 'high'
  },
  {
    department: 'Logística',
    description: 'Carga mal posicionada',
    date: new Date('2024-03-03'),
    status: 'closed',
    severity: 'medium'
  },
  {
    department: 'Qualidade',
    description: 'Reagente armazenado incorretamente',
    date: new Date('2024-03-04'),
    status: 'closed',
    severity: 'low'
  }
];

async function seedIncidents() {
  try {
    await connectToDatabase();
    const existingCount = await Incident.countDocuments();
    if (existingCount > 0) {
      logger.info(`Já existem ${existingCount} incidentes. Pulando inserção.`);
      return;
    }
    const result = await Incident.insertMany(initialIncidents);
    logger.info(`${result.length} incidentes inseridos com sucesso!`);
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao inserir incidentes', { error });
    process.exit(1);
  }
}

seedIncidents(); 