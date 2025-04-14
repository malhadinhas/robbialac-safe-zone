import { connectToDatabase, getCollection } from '../services/database';
import logger from '../utils/logger';

interface Department {
  value: string;
  label: string;
}

const departments: Department[] = [
  { value: 'producao', label: 'Produção' },
  { value: 'logistica', label: 'Logística' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'rh', label: 'Recursos Humanos' },
  { value: 'ti', label: 'Tecnologia da Informação' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'financeiro', label: 'Financeiro' }
];

async function seedDepartments() {
  try {
    logger.info('Iniciando população de departamentos...');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Obter a coleção
    const collection = await getCollection<Department>('departments');
    
    // Verificar se já existem departamentos
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      logger.info(`Já existem ${existingCount} departamentos. Pulando inserção.`);
      return;
    }
    
    // Inserir departamentos
    const result = await collection.insertMany(departments);
    
    logger.info(`${result.insertedCount} departamentos inseridos com sucesso!`);
  } catch (error) {
    logger.error('Erro ao popular departamentos:', { error });
  }
}

// Executar o script
seedDepartments().then(() => {
  logger.info('Script finalizado.');
  process.exit(0);
}).catch(error => {
  logger.error('Erro ao executar script:', { error });
  process.exit(1);
}); 