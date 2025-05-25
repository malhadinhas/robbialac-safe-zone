import { connectToDatabase, getCollection } from '../services/database';
import { ObjectId } from 'mongodb';
import logger from '../utils/logger';

/**
 * Este script adiciona medalhas e atividades iniciais para todos os usuários
 * que ainda não possuem dados
 */
async function seedInitialData() {
  try {
    // Conectar ao banco de dados
    await connectToDatabase();
    logger.info('Conexão com o banco de dados estabelecida');

    // Obter coleções
    const usersCollection = await getCollection('users');
    const userMedalsCollection = await getCollection('user_medals');
    const activitiesCollection = await getCollection('user_activities');
    const medalsCollection = await getCollection('medals');

    // Verificar se já existem medalhas no sistema
    const medalsCount = await medalsCollection.countDocuments();
    if (medalsCount === 0) {
      logger.info('Adicionando medalhas ao sistema...');
      
      const medalData = [
        {
          id: "observador-iniciante",
          name: "Observador Iniciante",
          description: "Completou o treinamento básico de observação de riscos",
          imageSrc: "/src/assets/medals/observador-iniciante.png",
          triggerAction: "trainingCompleted",
          triggerCategory: "Introdução",
          requiredCount: 1,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: "vigilante-ativo",
          name: "Vigilante Ativo",
          description: "Reportou 5 situações potencialmente perigosas",
          imageSrc: "/src/assets/medals/vigilante-ativo.png",
          triggerAction: "incidentReported",
          requiredCount: 5,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: "vigilante-dedicado",
          name: "Vigilante Dedicado",
          description: "Reportou 10 situações potencialmente perigosas",
          imageSrc: "/src/assets/medals/vigilante-dedicado.png",
          triggerAction: "incidentReported",
          requiredCount: 10,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: "observador-consistente",
          name: "Observador Consistente",
          description: "Identificou 15 riscos no ambiente de trabalho",
          imageSrc: "/src/assets/medals/observador-consistente.png",
          triggerAction: "incidentReported",
          requiredCount: 15,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: "guardiao-prevencao",
          name: "Guardião da Prevenção",
          description: "Contribuiu para 30 dias sem acidentes na fábrica",
          imageSrc: "/src/assets/medals/guardiao-prevencao.png",
          triggerAction: "incidentReported",
          requiredCount: 30,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      // Inserir medalhas
      await medalsCollection.insertMany(medalData);
      logger.info(`${medalData.length} medalhas inseridas no sistema`);
    }

    // Buscar todos os usuários
    const users = await usersCollection.find().toArray() as User[];
    logger.info(`Encontrados ${users.length} usuários no sistema`);

    let totalActivitiesAdded = 0;
    let totalMedalsAssigned = 0;

    // Para cada usuário, adicionar medalha básica e atividades iniciais se não tiver
    for (const user of users) {
      // Verificar se o usuário já tem medalhas
      const userMedalsCount = await userMedalsCollection.countDocuments({ userId: user.id });
      
      if (userMedalsCount === 0) {
        // Atribuir medalha inicial (Observador Iniciante)
        const initialMedal = {
          userId: user.id,
          medalId: "observador-iniciante", // ID descritivo
          dateEarned: new Date()
        };
        
        await userMedalsCollection.insertOne(initialMedal);
        totalMedalsAssigned++;
        
        // Buscar dados completos da medalha
        const medalData = await medalsCollection.findOne({ id: "observador-iniciante" });
        
        // Registrar atividade da medalha
        const medalActivity = {
          userId: user.id,
          category: 'medal',
          activityId: "observador-iniciante",
          points: 0,
          timestamp: new Date(),
          details: {
            name: medalData?.name || "Observador Iniciante",
            description: medalData?.description || "Completou o treinamento básico de observação de riscos",
            imageSrc: medalData?.imageSrc || "/src/assets/medals/observador-iniciante.png",
            manual: true
          }
        };
        
        await activitiesCollection.insertOne(medalActivity);
        totalActivitiesAdded++;
      }
      
      // Verificar se o usuário já tem atividades
      const userActivitiesCount = await activitiesCollection.countDocuments({ userId: user.id });
      
      if (userActivitiesCount <= 1) { // Pode ter apenas a atividade da medalha
        // Criar atividades iniciais
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        
        const initialActivities = [
          {
            userId: user.id,
            category: 'training',
            activityId: 'intro-training',
            points: 50,
            timestamp: ontem,
            details: {
              title: "Introdução à Segurança",
              category: "Introdução",
              isFullCourse: false
            }
          },
          {
            userId: user.id,
            category: 'video',
            activityId: 'intro-video',
            points: 50,
            timestamp: new Date(),
            details: {
              title: "Orientação de Segurança",
              category: "Segurança"
            }
          }
        ];
        
        // Adicionar atividades
        await activitiesCollection.insertMany(initialActivities);
        totalActivitiesAdded += initialActivities.length;
        
        // Atualizar pontos do usuário se necessário
        if (user.points === 0) {
          await usersCollection.updateOne(
            { id: user.id },
            { $set: { points: 100 } }
          );
          logger.info(`Pontos do usuário ${user.name} (${user.id}) atualizados para 100`);
        }
      }
    }

    logger.info(`Processo finalizado: ${totalMedalsAssigned} medalhas e ${totalActivitiesAdded} atividades adicionadas`);
  } catch (error) {
    logger.error('Erro ao inicializar dados:', error);
  } finally {
    process.exit(0);
  }
}

// Executar o script
seedInitialData(); 