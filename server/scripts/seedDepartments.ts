import { connectToDatabase } from '../services/database';
import Department from '../models/Department';
import logger from '../utils/logger';

const initialDepartments = [
  { name: 'Produção', color: '#FF4B4B', employeeCount: 40 },
  { name: 'Manutenção', color: '#4CAF50', employeeCount: 15 },
  { name: 'Logística', color: '#2196F3', employeeCount: 20 },
  { name: 'Qualidade', color: '#9C27B0', employeeCount: 10 },
  { name: 'Segurança', color: '#FF9800', employeeCount: 8 }
];

async function seedDepartments() {
  try {
    await connectToDatabase();
    const existingCount = await Department.countDocuments();
    if (existingCount > 0) {
      logger.info(`Já existem ${existingCount} departamentos. Pulando inserção.`);
      return;
    }
    const result = await Department.insertMany(initialDepartments);
    logger.info(`${result.length} departamentos inseridos com sucesso!`);
    process.exit(0);
  } catch (error) {
    logger.error('Erro ao inserir departamentos', { error });
    process.exit(1);
  }
}

seedDepartments(); 