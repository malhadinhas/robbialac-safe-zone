import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';

export interface Medal {
  _id?: ObjectId;
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  triggerAction: 'incidentReported' | 'videoWatched' | 'trainingCompleted';
  triggerCategory?: string;
  requiredCount: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserMedal {
  _id?: ObjectId;
  userId: string;
  medalId: string;
  dateEarned: Date;
  created_at?: Date;
  updated_at?: Date;
}

// Buscar todas as medalhas
export const getMedals = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Medal>('medals');
    const medals = await collection.find().toArray();
    
    logger.info('Medalhas recuperadas com sucesso', { count: medals.length });
    res.json(medals);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas', { error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas' });
  }
};

// Buscar medalhas de um usuário específico
export const getUserMedals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Buscar as relações entre usuário e medalhas
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const userMedals = await userMedalsCollection.find({ userId }).toArray();
    
    if (userMedals.length === 0) {
      logger.info('Nenhuma medalha encontrada para o usuário', { userId });
      return res.json([]);
    }
    
    // Obter os IDs das medalhas que o usuário possui
    const medalIds = userMedals.map(userMedal => userMedal.medalId);
    
    // Buscar as medalhas completas
    const medalsCollection = await getCollection<Medal>('medals');
    const medals = await medalsCollection.find({ id: { $in: medalIds } }).toArray();
    
    // Adicionar data de obtenção a cada medalha
    const medalsWithEarnedDate = medals.map(medal => {
      const userMedal = userMedals.find(um => um.medalId === medal.id);
      return {
        ...medal,
        dateEarned: userMedal?.dateEarned,
        acquired: true,
        acquiredDate: userMedal?.dateEarned
      };
    });
    
    logger.info('Medalhas do usuário recuperadas com sucesso', { userId, count: medals.length });
    res.json(medalsWithEarnedDate);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas do usuário', { userId: req.params.userId, error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas do usuário' });
  }
};

// Buscar medalhas não conquistadas por um usuário
export const getUserUnacquiredMedals = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Buscar as relações entre usuário e medalhas
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const userMedals = await userMedalsCollection.find({ userId }).toArray();
    
    // Obter os IDs das medalhas que o usuário possui
    const medalIds = userMedals.map(userMedal => userMedal.medalId);
    
    // Buscar todas as medalhas
    const medalsCollection = await getCollection<Medal>('medals');
    const allMedals = await medalsCollection.find().toArray();
    
    // Filtrar apenas as não conquistadas
    const unacquiredMedals = allMedals.filter(medal => !medalIds.includes(medal.id))
      .map(medal => ({
        ...medal,
        acquired: false
      }));
    
    logger.info('Medalhas não conquistadas recuperadas com sucesso', { userId, count: unacquiredMedals.length });
    res.json(unacquiredMedals);
  } catch (error) {
    logger.error('Erro ao recuperar medalhas não conquistadas', { userId: req.params.userId, error });
    res.status(500).json({ message: 'Erro ao recuperar medalhas não conquistadas' });
  }
};

/**
 * Verifica e atribui medalhas baseadas em contagem de ações após uma nova atividade ser registrada.
 * @param userId ID do usuário que realizou a atividade.
 * @param activityCategory Categoria da atividade registrada ('video', 'incident', 'training').
 * @param activityDetails Detalhes da atividade (necessário para 'video' e 'training' para verificar a categoria).
 * @returns Array de medalhas recém-conquistadas (se houver).
 */
export const checkActionBasedMedals = async (
  userId: string,
  activityCategory: 'video' | 'incident' | 'training',
  activityDetails?: any
): Promise<Medal[]> => {
  try {
    logger.info(`Verificando medalhas baseadas em ação para ${userId} após atividade ${activityCategory}`);

    // 1. Determinar o tipo de ação correspondente para buscar medalhas
    let targetTriggerAction: Medal['triggerAction'] | null = null;
    if (activityCategory === 'incident') targetTriggerAction = 'incidentReported';
    else if (activityCategory === 'video') targetTriggerAction = 'videoWatched';
    else if (activityCategory === 'training') targetTriggerAction = 'trainingCompleted';

    if (!targetTriggerAction) {
      logger.warn(`Categoria de atividade não mapeada para trigger de medalha: ${activityCategory}`);
      return [];
    }

    // 2. Buscar todas as medalhas que são acionadas por esta ação
    const medalsCollection = await getCollection<Medal>('medals');
    const potentialMedals = await medalsCollection.find({ triggerAction: targetTriggerAction }).toArray();

    if (potentialMedals.length === 0) {
      logger.info(`Nenhuma medalha encontrada para o trigger ${targetTriggerAction}`);
      return [];
    }

    // 3. Buscar as medalhas que o usuário JÁ possui para evitar re-atribuição
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const userEarnedMedals = await userMedalsCollection.find({ userId }).toArray();
    const earnedMedalIds = userEarnedMedals.map(um => um.medalId);

    // 4. Filtrar medalhas potenciais para obter apenas as que o usuário AINDA NÃO tem
    const medalsToCheck = potentialMedals.filter(medal => !earnedMedalIds.includes(medal.id));

    if (medalsToCheck.length === 0) {
      logger.info(`Usuário ${userId} já possui todas as medalhas para ${targetTriggerAction}`);
      return [];
    }

    // 5. Contar as atividades relevantes do usuário
    const activitiesCollection = await getCollection('user_activities');
    let userActionCount = 0;

    if (targetTriggerAction === 'incidentReported') {
      userActionCount = await activitiesCollection.countDocuments({ userId, category: 'incident' });
    } else if (targetTriggerAction === 'videoWatched') {
      // Para vídeos, precisamos filtrar pela categoria do vídeo DENTRO dos detalhes da atividade
      const videoCategory = activityDetails?.category; // Assumindo que details.category contém o nome da categoria
      if (!videoCategory) {
         logger.warn(`Detalhes da atividade de vídeo não contêm categoria para ${userId}`);
         // Não podemos verificar medalhas baseadas em categoria de vídeo sem a categoria
      } else {
          // Conta atividades de vídeo PARA ESTE USUÁRIO cuja categoria nos detalhes corresponde
           userActionCount = await activitiesCollection.countDocuments({ 
                userId, 
                category: 'video', 
                'details.category': videoCategory 
            });
             logger.info(`Contagem de vídeos da categoria '${videoCategory}' para ${userId}: ${userActionCount}`);
      }
    } else if (targetTriggerAction === 'trainingCompleted') {
       // Similar a vídeo, pode precisar filtrar por categoria de treino se houver
       const trainingCategory = activityDetails?.category; 
       if (trainingCategory) {
            userActionCount = await activitiesCollection.countDocuments({ userId, category: 'training', 'details.category': trainingCategory });
             logger.info(`Contagem de treinos da categoria '${trainingCategory}' para ${userId}: ${userActionCount}`);
       } else {
            // Contar todos os treinos se não houver categoria específica
             userActionCount = await activitiesCollection.countDocuments({ userId, category: 'training' });
             logger.info(`Contagem total de treinos para ${userId}: ${userActionCount}`);
       }
    }

    logger.info(`Contagem total da ação ${targetTriggerAction} para ${userId}: ${userActionCount}`);

    // 6. Verificar quais das medalhas pendentes foram alcançadas com esta contagem
    const newlyEarnedMedals: Medal[] = [];
    for (const medal of medalsToCheck) {
      // Se for medalha de vídeo/treino com categoria específica, só conta se a categoria da atividade bate com a da medalha
      if ((medal.triggerAction === 'videoWatched' || medal.triggerAction === 'trainingCompleted') && medal.triggerCategory) {
          if (activityDetails?.category !== medal.triggerCategory) {
              logger.debug(`Skipping medal ${medal.id}: category mismatch ('${activityDetails?.category}' vs '${medal.triggerCategory}')`);
              continue; // Pula esta medalha se a categoria não for a correta
          }
      }

      // Verifica se a contagem total da ação atinge o necessário para a medalha
      if (userActionCount >= medal.requiredCount) {
        logger.info(`Usuário ${userId} alcançou a medalha ${medal.name} (ID: ${medal.id}) com ${userActionCount}/${medal.requiredCount} ${medal.triggerAction}`);
        newlyEarnedMedals.push(medal);

        // Atribuir a medalha imediatamente no banco de dados
        await userMedalsCollection.insertOne({
          userId,
          medalId: medal.id,
          dateEarned: new Date(),
        });
        logger.info(`Medalha ${medal.id} atribuída a ${userId} no banco de dados.`);
      }
    }

    return newlyEarnedMedals;

  } catch (error) {
    logger.error(`Erro ao verificar medalhas baseadas em ação para ${userId}`, { error });
    return []; // Retorna array vazio em caso de erro
  }
};

/**
 * Atribui manualmente uma medalha a um usuário
 */
export const assignMedalToUser = async (req: Request, res: Response) => {
  try {
    const { userId, medalId } = req.params;
    
    if (!userId || !medalId) {
      logger.warn('Tentativa de atribuir medalha sem ID de usuário ou medalha', { userId, medalId });
      return res.status(400).json({ message: 'IDs de usuário e medalha são obrigatórios' });
    }
    
    // Verificar se a medalha existe
    const medalsCollection = await getCollection<Medal>('medals');
    const medal = await medalsCollection.findOne({ id: medalId });
    
    if (!medal) {
      logger.warn(`Medalha não encontrada: ${medalId}`);
      return res.status(404).json({ message: 'Medalha não encontrada' });
    }
    
    // Verificar se o usuário já possui esta medalha
    const userMedalsCollection = await getCollection<UserMedal>('user_medals');
    const existingMedal = await userMedalsCollection.findOne({ userId, medalId });
    
    if (existingMedal) {
      logger.info(`Usuário ${userId} já possui a medalha ${medalId}`);
      return res.status(200).json({ 
        message: 'Usuário já possui esta medalha', 
        dateEarned: existingMedal.dateEarned 
      });
    }
    
    // Atribuir a medalha ao usuário
    const userMedal = {
      userId,
      medalId,
      dateEarned: new Date()
    };
    
    await userMedalsCollection.insertOne(userMedal);
    
    logger.info(`Medalha ${medalId} atribuída manualmente ao usuário ${userId}`);
    
    // Registrar como atividade
    const activitiesCollection = await getCollection('user_activities');
    await activitiesCollection.insertOne({
      userId,
      category: 'medal',
      activityId: medalId,
      points: 0,
      timestamp: new Date(),
      details: {
        name: medal.name,
        description: medal.description,
        imageSrc: medal.imageSrc,
        manual: true
      }
    });
    
    res.status(201).json({
      message: 'Medalha atribuída com sucesso',
      medal: {
        id: medal.id,
        name: medal.name,
        dateEarned: userMedal.dateEarned
      }
    });
    
  } catch (error) {
    logger.error('Erro ao atribuir medalha ao usuário', { error });
    res.status(500).json({ message: 'Erro ao atribuir medalha ao usuário' });
  }
};

// --- NOVAS FUNÇÕES CRUD --- 

/**
 * Cria uma nova medalha no sistema
 */
export const createMedal = async (req: Request, res: Response) => {
  try {
    const medalData: Omit<Medal, '_id'> = req.body;

    // Validação básica (pode ser mais robusta com Zod, etc.)
    if (!medalData.id || !medalData.name || !medalData.description || !medalData.imageSrc || !medalData.triggerAction || !medalData.requiredCount) {
      logger.warn('Tentativa de criar medalha com dados incompletos', medalData);
      return res.status(400).json({ message: 'Dados incompletos para criar a medalha' });
    }
    if (medalData.requiredCount <= 0) {
        return res.status(400).json({ message: 'Contagem necessária deve ser maior que zero' });
    }
    if ((medalData.triggerAction === 'videoWatched' || medalData.triggerAction === 'trainingCompleted') && !medalData.triggerCategory) {
         return res.status(400).json({ message: 'Categoria é obrigatória para ações de vídeo ou treino' });
     }

    // Normalizar o ID (caso não tenha sido feito no frontend)
    medalData.id = medalData.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const collection = await getCollection<Medal>('medals');

    // Verificar se já existe uma medalha com este ID
    const existingMedal = await collection.findOne({ id: medalData.id });
    if (existingMedal) {
      logger.warn(`Tentativa de criar medalha com ID duplicado: ${medalData.id}`);
      return res.status(409).json({ message: `Medalha com ID '${medalData.id}' já existe` });
    }

    // Adicionar timestamps
    const medalToInsert: Medal = {
        ...medalData,
        created_at: new Date(),
        updated_at: new Date()
    }

    const result = await collection.insertOne(medalToInsert as any); // Usar `as any` temporariamente se o tipo do BSON for incompatível

    logger.info(`Nova medalha criada com sucesso: ${medalData.name} (ID: ${medalData.id})`);
    // Retornar o documento criado (ou pelo menos o ID)
    const createdMedal = await collection.findOne({ _id: result.insertedId });
    res.status(201).json(createdMedal);

  } catch (error) {
    logger.error('Erro ao criar medalha', { error });
    res.status(500).json({ message: 'Erro interno ao criar medalha' });
  }
};

/**
 * Atualiza uma medalha existente
 */
export const updateMedal = async (req: Request, res: Response) => {
  try {
    const { medalId } = req.params; // Este é o ID legível (slug)
    const updateData: Partial<Omit<Medal, '_id' | 'id'>> = req.body;

    logger.info(`Tentativa de atualizar medalha ${medalId}`, { 
      medalId,
      updateData,
      headers: req.headers,
      ip: req.ip
    });

     // Validação básica
    if (Object.keys(updateData).length === 0) {
      logger.warn(`Dados vazios para atualização da medalha ${medalId}`);
      return res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
    }
     if (updateData.requiredCount !== undefined && updateData.requiredCount <= 0) {
        logger.warn(`Contagem inválida para medalha ${medalId}: ${updateData.requiredCount}`);
        return res.status(400).json({ message: 'Contagem necessária deve ser maior que zero' });
    }
     // Validação de categoria condicional mais complexa (simplificada aqui)
     if ((updateData.triggerAction === 'videoWatched' || updateData.triggerAction === 'trainingCompleted') && updateData.triggerCategory === undefined) {
         // Cuidado: Se só mudar a contagem, a categoria pode não vir no updateData
         // Uma validação completa verificaria o estado combinado dos dados existentes e do update
         logger.warn(`Atualização de medalha ${medalId} pode resultar em estado inválido (ação vídeo/treino sem categoria)`);
         // Poderia buscar a medalha atual e validar o estado final
     }

    const collection = await getCollection<Medal>('medals');

    // Verificar se a medalha existe antes de atualizar
    const existingMedal = await collection.findOne({ id: medalId });
    if (!existingMedal) {
      logger.warn(`Tentativa de atualizar medalha não encontrada: ${medalId}`);
      
      // Mostrar todas as medalhas disponíveis para debug
      const allMedals = await collection.find({}, { projection: { id: 1, name: 1 } }).toArray();
      logger.info('Medalhas disponíveis no sistema:', { medals: allMedals });
      
      return res.status(404).json({ 
        message: 'Medalha não encontrada',
        requestedId: medalId,
        availableIds: allMedals.map(m => m.id)
      });
    }

    // Não permitir alterar o ID (slug)
    delete updateData.id;

    const result = await collection.updateOne(
      { id: medalId },
      { $set: { ...updateData, updated_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      logger.warn(`Tentativa de atualizar medalha não encontrada (após segunda verificação): ${medalId}`);
      return res.status(404).json({ message: 'Medalha não encontrada' });
    }

    const updatedMedal = await collection.findOne({ id: medalId });
    logger.info(`Medalha atualizada com sucesso: ${medalId}`, { 
      medalId, 
      before: existingMedal, 
      after: updatedMedal 
    });
    
    res.status(200).json(updatedMedal);

  } catch (error: any) {
    logger.error(`Erro ao atualizar medalha ${req.params.medalId}`, { 
      error: error.message, 
      stack: error.stack,
      medalId: req.params.medalId,
      body: req.body 
    });
    res.status(500).json({ message: 'Erro interno ao atualizar medalha' });
  }
};

/**
 * Deleta uma medalha do sistema
 */
export const deleteMedal = async (req: Request, res: Response) => {
  try {
    const { medalId } = req.params; // ID legível (slug)
    const collection = await getCollection<Medal>('medals');

    const result = await collection.deleteOne({ id: medalId });

    if (result.deletedCount === 0) {
      logger.warn(`Tentativa de deletar medalha não encontrada: ${medalId}`);
      return res.status(404).json({ message: 'Medalha não encontrada' });
    }

    // Opcional: Considerar remover as entradas correspondentes em `user_medals`
    // const userMedalsCollection = await getCollection('user_medals');
    // const deleteUserMedalsResult = await userMedalsCollection.deleteMany({ medalId });
    // logger.info(`Removidas ${deleteUserMedalsResult.deletedCount} entradas de user_medals para a medalha ${medalId}`);

    logger.info(`Medalha deletada com sucesso: ${medalId}`);
    res.status(200).json({ message: 'Medalha deletada com sucesso' });

  } catch (error) {
    logger.error(`Erro ao deletar medalha ${req.params.medalId}`, { error });
    res.status(500).json({ message: 'Erro interno ao deletar medalha' });
  }
}; 