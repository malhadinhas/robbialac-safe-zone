import { connectToDatabase, getCollection } from '../services/database';
import logger from '../utils/logger';

interface Incident {
  id: string;
  departmentId: string;
  description: string;
  date: Date;
  status: 'open' | 'closed';
  severity: 'low' | 'medium' | 'high';
}

const initialIncidents: Omit<Incident, 'id'>[] = [
  {
    departmentId: '1', // Produção
    description: 'Quase acidente com empilhadeira',
    date: new Date('2024-03-01'),
    status: 'closed',
    severity: 'high'
  },
  {
    departmentId: '1',
    description: 'Derramamento de produto químico',
    date: new Date('2024-03-05'),
    status: 'closed',
    severity: 'medium'
  },
  {
    departmentId: '2', // Manutenção
    description: 'Ferramenta solta em altura',
    date: new Date('2024-03-02'),
    status: 'closed',
    severity: 'high'
  },
  {
    departmentId: '3', // Logística
    description: 'Carga mal posicionada',
    date: new Date('2024-03-03'),
    status: 'closed',
    severity: 'medium'
  },
  {
    departmentId: '4', // Qualidade
    description: 'Reagente armazenado incorretamente',
    date: new Date('2024-03-04'),
    status: 'closed',
    severity: 'low'
  }
];

async function seedIncidents() {
  try {
    await connectToDatabase();
    const collection = await getCollection<Incident>('incidents');
    
    // Limpa a coleção existente
    await collection.deleteMany({});
    
    // Adiciona IDs aos incidentes
    const incidentsWithIds = initialIncidents.map((incident, index) => ({
      ...incident,
      id: (index + 1).toString()
    }));
    
    // Insere os incidentes iniciais
    const result = await collection.insertMany(incidentsWithIds);
    
    logger.info('Incidentes inseridos com sucesso', {
      count: result.insertedCount
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao inserir incidentes', { error });
    process.exit(1);
  }
}

seedIncidents(); 