import { connectToDatabase } from '../services/database';
import Medal from '../models/Medal';
import logger from '../utils/logger';
import { randomUUID } from 'crypto';

const medals = [
  {
    id: randomUUID(),
    name: 'Segurança em Foco',
    description: 'Concedida a colaboradores que completaram todos os módulos de segurança.',
    imageSrc: '/images/medals/safety_focus.png',
    triggerAction: 'incidentReported',
    requiredCount: 1
  },
  {
    id: randomUUID(),
    name: 'Mestre da Qualidade',
    description: 'Reconhecimento por excelência em práticas de qualidade.',
    imageSrc: '/images/medals/quality_master.png',
    triggerAction: 'incidentReported',
    requiredCount: 1
  },
  {
    id: randomUUID(),
    name: 'Guardião de Regras',
    description: 'Atribuída a quem demonstra conhecimento excepcional de procedimentos.',
    imageSrc: '/images/medals/rules_guardian.png',
    triggerAction: 'incidentReported',
    requiredCount: 1
  },
  {
    id: randomUUID(),
    name: 'Prevenção Total',
    description: 'Reconhecimento por contribuir ativamente para a prevenção de acidentes.',
    imageSrc: '/images/medals/prevention.png',
    triggerAction: 'incidentReported',
    requiredCount: 1
  },
  {
    id: randomUUID(),
    name: 'Inovador',
    description: 'Premiação por sugestões inovadoras que melhoram a segurança ou eficiência.',
    imageSrc: '/images/medals/innovator.png',
    triggerAction: 'incidentReported',
    requiredCount: 1
  }
];

async function seedMedals() {
  try {
    logger.info('Iniciando população de medalhas...');
    await connectToDatabase();
    const existingCount = await Medal.countDocuments();
    if (existingCount > 0) {
      logger.info(`Já existem ${existingCount} medalhas. Pulando inserção.`);
      return;
    }
    const result = await Medal.insertMany(medals);
    logger.info(`${result.length} medalhas inseridas com sucesso!`);
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