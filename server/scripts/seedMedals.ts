import { connectToDatabase, getCollection } from '../services/database';
import { Medal } from '../controllers/medalController';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

const medals: Omit<Medal, 'created_at' | 'updated_at'>[] = [
  {
    id: randomUUID(),
    name: 'Segurança em Foco',
    description: 'Concedida a colaboradores que completaram todos os módulos de segurança.',
    imageSrc: '/images/medals/safety_focus.png',
    category: 'Segurança'
  },
  {
    id: randomUUID(),
    name: 'Mestre da Qualidade',
    description: 'Reconhecimento por excelência em práticas de qualidade.',
    imageSrc: '/images/medals/quality_master.png',
    category: 'Qualidade'
  },
  {
    id: randomUUID(),
    name: 'Guardião de Regras',
    description: 'Atribuída a quem demonstra conhecimento excepcional de procedimentos.',
    imageSrc: '/images/medals/rules_guardian.png',
    category: 'Procedimentos e Regras'
  },
  {
    id: randomUUID(),
    name: 'Prevenção Total',
    description: 'Reconhecimento por contribuir ativamente para a prevenção de acidentes.',
    imageSrc: '/images/medals/prevention.png',
    category: 'Segurança'
  },
  {
    id: randomUUID(),
    name: 'Inovador',
    description: 'Premiação por sugestões inovadoras que melhoram a segurança ou eficiência.',
    imageSrc: '/images/medals/innovator.png',
    category: 'Inovação'
  }
];

async function seedMedals() {
  try {
    logger.info('Iniciando população de medalhas...');
    
    // Conectar ao banco de dados
    await connectToDatabase();
    
    // Obter a coleção
    const collection = await getCollection<Medal>('medals');
    
    // Verificar se já existem medalhas
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      logger.info(`Já existem ${existingCount} medalhas. Pulando inserção.`);
      return;
    }
    
    // Inserir medalhas
    const result = await collection.insertMany(medals as Medal[]);
    
    logger.info(`${result.insertedCount} medalhas inseridas com sucesso!`);
  } catch (error) {
    logger.error('Erro ao popular medalhas:', { error });
  }
}

// Executar o script
seedMedals().then(() => {
  logger.info('Script finalizado.');
  process.exit(0);
}).catch(error => {
  logger.error('Erro ao executar script:', { error });
  process.exit(1);
}); 