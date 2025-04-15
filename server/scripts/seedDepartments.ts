import { connectToDatabase, getCollection } from '../services/database';
import logger from '../utils/logger';

interface Department {
  id: string;
  name: string;
  color: string;
  employeeCount: number;
}

const initialDepartments: Department[] = [
  {
    id: '1',
    name: 'Produção',
    color: '#FF4B4B',
    employeeCount: 40
  },
  {
    id: '2',
    name: 'Manutenção',
    color: '#4CAF50',
    employeeCount: 15
  },
  {
    id: '3',
    name: 'Logística',
    color: '#2196F3',
    employeeCount: 20
  },
  {
    id: '4',
    name: 'Qualidade',
    color: '#9C27B0',
    employeeCount: 10
  },
  {
    id: '5',
    name: 'Segurança',
    color: '#FF9800',
    employeeCount: 8
  }
];

async function seedDepartments() {
  try {
    await connectToDatabase();
    const collection = await getCollection<Department>('departments');
    
    // Limpa a coleção existente
    await collection.deleteMany({});
    
    // Insere os departamentos iniciais
    const result = await collection.insertMany(initialDepartments);
    
    logger.info('Departamentos inseridos com sucesso', {
      count: result.insertedCount
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao inserir departamentos', { error });
    process.exit(1);
  }
}

seedDepartments(); 