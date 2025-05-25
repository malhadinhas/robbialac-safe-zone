import { connectToDatabase } from '../services/database';
import ZoneStats from '../models/ZoneStats';
import CategoryStats from '../models/CategoryStats';
import logger from '../utils/logger';

const zoneStats = [
  {
    zoneId: 'zona1',
    zoneName: 'Zona 1',
    stats: {
      videosWatched: 23,
      totalVideos: 30,
      completionRate: 76.7,
      safetyScore: 85
    }
  },
  {
    zoneId: 'zona2',
    zoneName: 'Zona 2',
    stats: {
      videosWatched: 18,
      totalVideos: 25,
      completionRate: 72.0,
      safetyScore: 80
    }
  },
  {
    zoneId: 'zona3',
    zoneName: 'Zona 3',
    stats: {
      videosWatched: 15,
      totalVideos: 20,
      completionRate: 75.0,
      safetyScore: 78
    }
  },
  {
    zoneId: 'zona4',
    zoneName: 'Zona 4',
    stats: {
      videosWatched: 12,
      totalVideos: 15,
      completionRate: 80.0,
      safetyScore: 88
    }
  },
  {
    zoneId: 'zona5',
    zoneName: 'Zona 5',
    stats: {
      videosWatched: 20,
      totalVideos: 22,
      completionRate: 90.9,
      safetyScore: 95
    }
  }
];

const categoryStats = [
  {
    categoryId: 'seguranca',
    title: 'Segurança',
    description: 'Vídeos sobre procedimentos de segurança no ambiente de trabalho',
    videosCompleted: 35,
    totalVideos: 42,
    iconName: 'Shield'
  },
  {
    categoryId: 'qualidade',
    title: 'Qualidade',
    description: 'Instruções para garantir a qualidade em processos produtivos',
    videosCompleted: 28,
    totalVideos: 36,
    iconName: 'BadgeCheck'
  },
  {
    categoryId: 'procedimentos',
    title: 'Procedimentos e Regras',
    description: 'Normas e procedimentos essenciais para o funcionamento da fábrica',
    videosCompleted: 45,
    totalVideos: 50,
    iconName: 'ClipboardList'
  }
];

async function seedZoneStats() {
  try {
    logger.info('Iniciando população de estatísticas de zonas...');
    await connectToDatabase();

    // Estatísticas de zonas
    const existingZoneStatsCount = await ZoneStats.countDocuments();
    if (existingZoneStatsCount === 0) {
      const zoneStatsResult = await ZoneStats.insertMany(zoneStats);
      logger.info(`${zoneStatsResult.length} estatísticas de zona inseridas com sucesso!`);
    } else {
      logger.info(`Já existem ${existingZoneStatsCount} estatísticas de zona. Pulando inserção.`);
    }

    // Estatísticas de categorias
    const existingCategoryStatsCount = await CategoryStats.countDocuments();
    if (existingCategoryStatsCount === 0) {
      const categoryStatsResult = await CategoryStats.insertMany(categoryStats);
      logger.info(`${categoryStatsResult.length} estatísticas de categoria inseridas com sucesso!`);
    } else {
      logger.info(`Já existem ${existingCategoryStatsCount} estatísticas de categoria. Pulando inserção.`);
    }
  } catch (error) {
    logger.error('Erro ao popular estatísticas:', { error });
  }
}

seedZoneStats().then(() => {
  logger.info('Script finalizado.');
  process.exit(0);
}).catch(error => {
  logger.error('Erro ao executar script:', { error });
  process.exit(1);
}); 