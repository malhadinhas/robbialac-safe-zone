/**
 * @module server/controllers/medalController
 * @description Este módulo contém as funções controladoras (handlers) para as rotas da API
 * relacionadas a Medalhas (conquistas/badges) na plataforma. Ele lida com a busca
 * de medalhas disponíveis, a verificação e atribuição de medalhas aos usuários
 * (automaticamente com base em ações ou manualmente), e as operações CRUD
 * (Criar, Ler, Atualizar, Deletar) para gerenciar as próprias medalhas.
 */
import { Request, Response } from 'express';
import Medal from '../models/Medal';
import logger from '../utils/logger'; // Utilitário de logging
import { ObjectId } from 'mongodb'; // Tipo ObjectId do MongoDB
import { UserActivity } from '../models/UserActivity';
import UserMedal from '../models/UserMedal';
import { AuthenticatedRequest } from '../types/express';

/**
 * @interface Medal
 * @description Define a estrutura de um documento na coleção 'medals'.
 * Representa uma medalha/conquista que pode ser obtida na plataforma.
 */
export interface Medal {
  _id?: ObjectId;       // ID interno do MongoDB (opcional)
  id: string;           // ID legível/único (ex: 'reporter-ouro', 'vigilante-videos')
  name: string;         // Nome da medalha (ex: "Repórter de Ouro")
  description: string;  // Descrição do que a medalha representa
  imageSrc: string;     // Caminho/URL para a imagem da medalha
  // Ação que aciona a verificação desta medalha
  triggerAction: 'incidentReported' | 'videoWatched' | 'trainingCompleted';
  // Categoria específica da ação (ex: categoria de vídeo/treino) para medalhas mais específicas
  triggerCategory?: string;
  // Quantidade da ação necessária para ganhar a medalha
  requiredCount: number;
  // Timestamps automáticos (opcionais na interface, mas geralmente presentes se configurados no DB)
  created_at?: Date;
  updated_at?: Date;
}

/**
 * @interface UserMedal
 * @description Define a estrutura de um documento na coleção 'user_medals'.
 * Representa a relação entre um usuário e uma medalha que ele conquistou.
 */
export interface UserMedal {
  _id?: ObjectId;       // ID interno do MongoDB (opcional)
  userId: string;       // ID do usuário que conquistou a medalha
  medalId: string;      // ID legível da medalha conquistada (corresponde a Medal.id)
  dateEarned: Date;     // Data e hora em que a medalha foi conquistada
  // Timestamps automáticos (opcionais)
  created_at?: Date;
  updated_at?: Date;
}

/**
 * @function getMedals
 * @description Controladora para buscar todas as medalhas disponíveis no sistema.
 * @param {Request} req - Objeto da requisição Express.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON de todas as medalhas ou um erro (500).
 */
export const getMedals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Busca todos os documentos na coleção.
    const medals = await Medal.find();

    logger.info('Medalhas recuperadas com sucesso', { count: medals.length });
    if (!medals || medals.length === 0) {
      res.json([]); // Retorna array vazio e encerra.
      return;
    }
    // Responde com o array de medalhas.
    res.json(medals);
  } catch (error: unknown) {
    logger.error('Erro ao recuperar medalhas', { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Erro ao recuperar medalhas' });
  }
};

/**
 * @function getUserMedals
 * @description Controladora para buscar as medalhas que um usuário específico conquistou.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.userId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON das medalhas conquistadas pelo usuário (com data) ou um erro (500).
 */
export const getUserMedals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; // ID do usuário da URL.
    logger.info(`Buscando medalhas para o usuário: ${userId}`);

    // 1. Buscar as entradas na coleção 'user_medals' para este usuário.
    const userMedals = await UserMedal.find({ userId });

    // Se o usuário não tem nenhuma medalha, retorna um array vazio.
    if (userMedals.length === 0) {
      logger.info('Nenhuma medalha encontrada para o usuário', { userId });
      res.json([]); // Retorna array vazio e encerra.
      return;
    }

    // 2. Obter os IDs (string) das medalhas que o usuário possui a partir dos resultados anteriores.
    const medalIds = userMedals.map(userMedal => userMedal.medalId);
    logger.debug(`Usuário ${userId} possui IDs de medalha:`, medalIds);

    // 3. Buscar os detalhes completos das medalhas na coleção 'medals' usando os IDs obtidos.
    const medals = await Medal.find({ id: { $in: medalIds } });
    logger.debug(`Detalhes das medalhas encontradas: ${medals.length} itens.`);

    // 4. Combinar os detalhes da medalha com a data em que foi conquistada pelo usuário.
    const medalsWithEarnedDate = medals.map(medal => {
      // Encontra a entrada correspondente em 'userMedals' para obter a data.
      const userMedal = userMedals.find(um => um.medalId === medal.id);
      // Retorna um novo objeto com todos os dados da medalha e a data de conquista.
      // Adiciona também campos 'acquired' e 'acquiredDate' para consistência com outras funções/frontend.
      return {
        ...medal, // Copia todos os campos da medalha original
        dateEarned: userMedal?.dateEarned, // Adiciona a data da conquista (pode ser undefined se algo der errado)
        acquired: true, // Indica que esta medalha foi adquirida
        acquiredDate: userMedal?.dateEarned // Nome alternativo para a data
      };
    });

    logger.info('Medalhas do usuário recuperadas com sucesso', { userId, count: medalsWithEarnedDate.length });
    // Responde com o array das medalhas conquistadas, incluindo a data.
    res.json(medalsWithEarnedDate);
  } catch (error: unknown) {
    logger.error('Erro ao recuperar medalhas do usuário', { userId: req.params.userId, error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Erro ao recuperar medalhas do usuário' });
  }
};

/**
 * @function getUserUnacquiredMedals
 * @description Controladora para buscar as medalhas que um usuário específico AINDA NÃO conquistou.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.userId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON das medalhas não conquistadas pelo usuário ou um erro (500).
 */
export const getUserUnacquiredMedals = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params; // ID do usuário da URL.
    logger.info(`Buscando medalhas não conquistadas pelo usuário: ${userId}`);

    // 1. Buscar os IDs das medalhas que o usuário JÁ possui (coleção 'user_medals').
    const userMedals = await UserMedal.find({ userId });
    // Extrai apenas os IDs das medalhas possuídas.
    const acquiredMedalIds = userMedals.map(userMedal => userMedal.medalId);
    logger.debug(`Usuário ${userId} possui IDs de medalha:`, acquiredMedalIds);

    // 2. Buscar TODAS as medalhas disponíveis no sistema (coleção 'medals').
    const allMedals = await Medal.find();
    logger.debug(`Total de medalhas no sistema: ${allMedals.length}`);

    // 3. Filtrar a lista de todas as medalhas para manter apenas aquelas cujo ID NÃO está na lista de medalhas adquiridas.
    const unacquiredMedals = allMedals
      .filter(medal => !acquiredMedalIds.includes(medal.id)) // Filtra as não adquiridas
      .map(medal => ({ // Mapeia para adicionar o status 'acquired: false'
        ...medal,
        acquired: false
      }));

    logger.info('Medalhas não conquistadas recuperadas com sucesso', { userId, count: unacquiredMedals.length });
    // Responde com o array das medalhas não conquistadas.
    res.json(unacquiredMedals);
  } catch (error: unknown) {
    logger.error('Erro ao recuperar medalhas não conquistadas', { userId: req.params.userId, error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ message: 'Erro ao recuperar medalhas não conquistadas' });
  }
};

/**
 * @function checkActionBasedMedals
 * @description Verifica se uma ação recém-registrada por um usuário desbloqueia novas medalhas
 *              baseadas na contagem dessa ação (ou de uma categoria específica da ação).
 *              Se medalhas forem desbloqueadas, elas são automaticamente atribuídas ao usuário
 *              na coleção 'user_medals'.
 * @param {string} userId - ID do usuário que realizou a atividade.
 * @param {'video' | 'incident' | 'training'} activityCategory - Categoria da atividade registrada.
 * @param {any} [activityDetails] - Detalhes da atividade (usado para verificar `category` em vídeos/treinos).
 * @returns {Promise<Medal[]>} Uma Promise que resolve com um array das medalhas recém-conquistadas (pode ser vazio).
 */
export const checkActionBasedMedals = async (
  userId: string,
  activityCategory: 'video' | 'incident' | 'training',
  activityDetails?: Record<string, unknown>
): Promise<Medal[]> => {
  try {
    logger.info(`Verificando medalhas baseadas em ação para ${userId} após atividade ${activityCategory}`);

    // 1. Mapear a categoria da atividade para o 'triggerAction' correspondente da medalha.
    let targetTriggerAction: Medal['triggerAction'] | null = null;
    if (activityCategory === 'incident') targetTriggerAction = 'incidentReported';
    else if (activityCategory === 'video') targetTriggerAction = 'videoWatched';
    else if (activityCategory === 'training') targetTriggerAction = 'trainingCompleted';

    // Se a categoria da atividade não corresponde a nenhum gatilho de medalha, encerra.
    if (!targetTriggerAction) {
      logger.warn(`Categoria de atividade não mapeada para trigger de medalha: ${activityCategory}`, { userId });
      return [];
    }

    // 2. Buscar todas as medalhas que são acionadas por este tipo de ação (`triggerAction`).
    const medals = await Medal.find({ triggerAction: targetTriggerAction });

    // Se não há medalhas definidas para essa ação, encerra.
    if (medals.length === 0) {
      logger.info(`Nenhuma medalha encontrada no sistema para o trigger ${targetTriggerAction}`);
      return [];
    }
    logger.debug(`Encontradas ${medals.length} medalhas potenciais para ${targetTriggerAction}.`);

    // 3. Buscar as medalhas que este usuário específico JÁ possui.
    const userMedals = await UserMedal.find({ userId });
    // Cria um array apenas com os IDs das medalhas já ganhas.
    const earnedMedalIds = userMedals.map(um => um.medalId);
    logger.debug(`Usuário ${userId} já possui ${earnedMedalIds.length} medalhas. IDs:`, earnedMedalIds);

    // 4. Filtrar as medalhas potenciais, removendo as que o usuário já ganhou.
    // `medalsToCheck` contém apenas as medalhas que o usuário *poderia* ganhar com esta ação.
    const medalsToCheck = medals.filter(medal => !earnedMedalIds.includes(medal.id));

    // Se não há medalhas novas a verificar para este usuário e ação, encerra.
    if (medalsToCheck.length === 0) {
      logger.info(`Usuário ${userId} já possui todas as ${medals.length} medalhas disponíveis para ${targetTriggerAction} ou não há medalhas novas.`);
      return [];
    }
    logger.debug(`Verificando ${medalsToCheck.length} medalhas que o usuário ${userId} ainda não possui para ${targetTriggerAction}.`);

    // 5. Contar quantas vezes o usuário realizou a ação relevante.
    const activities = await UserActivity.find();
    let userActionCount = 0; // Inicializa a contagem.
    let filterCategory: string | undefined = undefined; // Categoria específica para vídeo/treino

    // Lógica de contagem específica por tipo de ação:
    if (targetTriggerAction === 'incidentReported') {
      // Conta todas as atividades de incidente do usuário.
      userActionCount = await activities.countDocuments({ userId, category: 'incident' });
    } else if (targetTriggerAction === 'videoWatched') {
      // Para vídeos, verifica se a medalha exige uma categoria específica.
      // Obtém a categoria do vídeo assistido a partir dos detalhes da atividade.
      filterCategory = activityDetails?.category as string;
      if (!filterCategory) {
         // Se os detalhes não informam a categoria, não podemos verificar medalhas específicas de categoria.
         // Poderia contar todos os vídeos, mas a lógica atual foca em categorias.
         logger.warn(`Detalhes da atividade de vídeo não contêm 'category' para ${userId}. Não é possível contar para medalhas específicas de categoria.`);
         // Define a contagem como 0 para não atribuir medalhas incorretamente.
         userActionCount = 0;
      } else {
          // Conta atividades da categoria 'video' E cuja propriedade 'details.category' corresponde.
           userActionCount = await activities.countDocuments({
                userId,
                category: 'video',
                'details.category': filterCategory // Filtra pela categoria dentro do objeto 'details'.
            });
            logger.info(`Contagem de vídeos da categoria '${filterCategory}' para ${userId}: ${userActionCount}`);
      }
    } else if (targetTriggerAction === 'trainingCompleted') {
       // Lógica similar para treinos, verifica se há categoria nos detalhes.
       filterCategory = activityDetails?.category as string;
       if (filterCategory) {
            // Conta treinos da categoria específica.
            userActionCount = await activities.countDocuments({ userId, category: 'training', 'details.category': filterCategory });
             logger.info(`Contagem de treinos da categoria '${filterCategory}' para ${userId}: ${userActionCount}`);
       } else {
            // Se não houver categoria nos detalhes, conta todos os treinos completados.
             userActionCount = await activities.countDocuments({ userId, category: 'training' });
             logger.info(`Contagem total de treinos para ${userId}: ${userActionCount}`);
       }
    }

    logger.info(`Contagem total da ação relevante (${targetTriggerAction}${filterCategory ? `/${filterCategory}` : ''}) para ${userId}: ${userActionCount}`);

    // 6. Verificar, para cada medalha pendente, se a contagem alcançou o necessário.
    const newlyEarnedMedals: Medal[] = []; // Array para armazenar as medalhas recém-ganhas.
    for (const medal of medalsToCheck) {
      // Passo de verificação adicional: Se a medalha é para uma categoria específica (vídeo/treino)...
      if ((medal.triggerAction === 'videoWatched' || medal.triggerAction === 'trainingCompleted') && medal.triggerCategory) {
          // ...e a categoria da atividade que acionou esta verificação NÃO é a mesma da medalha...
          if (filterCategory !== medal.triggerCategory) {
              logger.debug(`Pula verificação da medalha ${medal.id}: categoria da atividade ('${filterCategory}') diferente da categoria requerida ('${medal.triggerCategory}').`);
              continue; // ...então pula a verificação desta medalha e vai para a próxima.
          }
      }

      // Verifica se a contagem de ações do usuário é maior ou igual à contagem requerida pela medalha.
      if (userActionCount >= medal.requiredCount) {
        // Se sim, o usuário ganhou esta medalha!
        logger.info(`Usuário ${userId} ALCANÇOU a medalha ${medal.name} (ID: ${medal.id}) com ${userActionCount}/${medal.requiredCount} ${medal.triggerAction} ${medal.triggerCategory ? `(cat: ${medal.triggerCategory})` : ''}`);
        newlyEarnedMedals.push(medal); // Adiciona ao array de medalhas ganhas nesta execução.

        // **Atribui a medalha ao usuário no banco de dados imediatamente.**
        await UserMedal.create({
          userId, // ID do usuário
          medalId: medal.id, // ID (string) da medalha
          dateEarned: new Date(), // Data/hora atual
        });
        logger.info(`Medalha ${medal.id} ATRIBUÍDA a ${userId} na coleção 'user_medals'.`);
      } else {
          // Se a contagem não foi atingida.
          logger.debug(`Usuário ${userId} NÃO alcançou a medalha ${medal.id} (${medal.name}). Contagem: ${userActionCount}/${medal.requiredCount}.`);
      }
    }

    // Retorna o array de medalhas que foram recém-conquistadas e atribuídas nesta chamada.
    return newlyEarnedMedals;

  } catch (error: unknown) {
    logger.error('Erro ao verificar medalhas baseadas em ação', { userId, activityCategory, error: error instanceof Error ? error.message : String(error) });
    return [];
  }
};

/**
 * @function assignMedalToUser
 * @description Controladora para atribuir manualmente uma medalha a um usuário (provavelmente por um admin).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.userId` e `req.params.medalId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com sucesso (200 ou 201) ou erro (400, 404, 500).
 */
export const assignMedalToUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, medalId } = req.params; // IDs da URL.
    logger.info(`Tentativa de atribuir manualmente a medalha ${medalId} ao usuário ${userId}`);

    // Validação básica dos IDs.
    if (!userId || !medalId) {
      logger.warn('Atribuição manual de medalha: IDs de usuário ou medalha ausentes.', { userId, medalId });
      res.status(400).json({ message: 'IDs de usuário e medalha são obrigatórios' });
      return;
    }

    // 1. Verificar se a medalha existe no sistema.
    const medal = await Medal.findOne({ id: medalId });
    if (!medal) {
      logger.warn(`Atribuição manual: Medalha não encontrada com ID: ${medalId}`);
      res.status(404).json({ message: 'Medalha não encontrada' });
      return;
    }

    // 2. Verificar se o usuário já possui esta medalha para evitar duplicatas.
    const existingMedal = await UserMedal.findOne({ userId, medalId });
    if (existingMedal) {
      logger.info(`Usuário ${userId} já possui a medalha ${medalId} (atribuída em ${existingMedal.dateEarned}). Atribuição manual ignorada.`);
      res.status(200).json({
        message: 'Usuário já possui esta medalha',
        dateEarned: existingMedal.dateEarned
      });
      return;
    }

    // 3. Se a medalha existe e o usuário não a possui, cria a relação em 'user_medals'.
    const userMedal = {
      userId,
      medalId,
      dateEarned: new Date() // Define a data de conquista como agora.
    };
    await UserMedal.create(userMedal);
    logger.info(`Medalha ${medalId} atribuída manualmente com sucesso ao usuário ${userId}`);

    // 4. Registrar a atribuição manual como uma atividade no histórico do usuário.
    await UserActivity.create({
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
    logger.info(`Atividade registrada para atribuição manual da medalha ${medalId} ao usuário ${userId}`);

    // 5. Responde com sucesso (201 Created, pois um novo recurso 'user_medal' foi criado).
    res.status(201).json({
      message: 'Medalha atribuída com sucesso',
      medal: { // Retorna informações básicas da medalha atribuída.
        id: medal.id,
        name: medal.name,
        dateEarned: userMedal.dateEarned
      }
    });

  } catch (error: unknown) {
    // Captura e loga erros gerais.
    logger.error('Erro ao atribuir medalha manualmente ao usuário', { error: error instanceof Error ? error.message : String(error), params: req.params });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro ao atribuir medalha ao usuário' });
  }
};

// --- NOVAS FUNÇÕES CRUD para gerenciar Medalhas ---

/**
 * @function createMedal
 * @description Controladora para criar uma nova medalha no sistema (gerenciamento).
 * @param {Request} req - Objeto da requisição Express (espera `req.body` com dados da nova medalha).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com a medalha criada (201) ou erro (400, 409, 500).
 */
export const createMedal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Obtém os dados da nova medalha do corpo da requisição.
    // Tipagem Omit<Medal, '_id'> indica que esperamos todos os campos exceto _id.
    const medalData: Omit<Medal, '_id'> = req.body;
    logger.info('Requisição para criar nova medalha recebida.', { data: medalData });

    // Validação básica dos campos obrigatórios.
    // Uma biblioteca como Zod seria mais robusta para validação.
    if (!medalData.id || !medalData.name || !medalData.description || !medalData.imageSrc || !medalData.triggerAction || !medalData.requiredCount) {
      logger.warn('Tentativa de criar medalha com dados incompletos', medalData);
      res.status(400).json({ message: 'Dados incompletos para criar a medalha' });
      return;
    }
    if (medalData.requiredCount <= 0) {
      res.status(400).json({ message: 'Contagem necessária deve ser maior que zero' });
      return;
    }
    if ((medalData.triggerAction === 'videoWatched' || medalData.triggerAction === 'trainingCompleted') && !medalData.triggerCategory) {
      res.status(400).json({ message: 'Categoria é obrigatória para ações de vídeo ou treino' });
      return;
    }

    // Normaliza o ID string fornecido (lowercase, sem espaços, caracteres especiais).
    // Isso cria um "slug" consistente para o ID.
    medalData.id = medalData.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    logger.info(`ID normalizado para a nova medalha: ${medalData.id}`);

    // Obtém a coleção 'medals'.
    const medal = await Medal.create(medalData);

    logger.info(`Nova medalha criada com sucesso: ${medalData.name} (ID: ${medalData.id}), _id: ${medal._id}`);
    // Responde com 201 Created e o documento da medalha criada.
    res.status(201).json(medal);

  } catch (error: unknown) {
    // Captura e loga erros gerais.
    logger.error('Erro ao criar medalha', { error: error instanceof Error ? error.message : String(error), body: req.body });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro interno ao criar medalha' });
  }
};

/**
 * @function updateMedal
 * @description Controladora para atualizar os dados de uma medalha existente (gerenciamento).
 * Identifica a medalha pelo seu `id` (string/slug) passado na URL.
 * Não permite alterar o `id` da medalha.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.medalId` e `req.body` com dados a atualizar).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com a medalha atualizada (200) ou erro (400, 404, 500).
 */
export const updateMedal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { medalId } = req.params;
    const updateData: Record<string, unknown> = { name: req.body.name, country: req.body.country, date: new Date(req.body.date) };
    logger.info(`Requisição para atualizar medalha recebida: ${medalId}`, { updateData });

    if (Object.keys(updateData).length === 0) {
      logger.warn(`Nenhum dado fornecido para atualização da medalha ${medalId}`);
      res.status(400).json({ message: 'Nenhum dado fornecido para atualização' });
      return;
    }
    if (updateData.requiredCount !== undefined && updateData.requiredCount <= 0) {
      logger.warn(`Contagem inválida na atualização da medalha ${medalId}: ${updateData.requiredCount}`);
      res.status(400).json({ message: 'Contagem necessária deve ser maior que zero' });
      return;
    }
    if ((updateData.triggerAction === 'videoWatched' || updateData.triggerAction === 'trainingCompleted') && updateData.triggerCategory === undefined) {
      logger.warn(`Atualização de medalha ${medalId} pode resultar em estado inválido (ação vídeo/treino sem categoria) - validação incompleta.`);
    }
    delete (updateData as Partial<Omit<Medal, '_id' | 'id'>>).id;
    const updatedMedal = await Medal.findOneAndUpdate(
      { id: medalId },
      { $set: { ...updateData, updated_at: new Date() } },
      { new: true }
    );
    if (!updatedMedal) {
      logger.warn(`Tentativa de atualizar medalha não encontrada: ${medalId}`);
      res.status(404).json({ message: 'Medalha não encontrada' });
      return;
    }
    logger.info(`Medalha atualizada com sucesso: ${medalId}`);
    res.status(200).json(updatedMedal);
  } catch (error: unknown) {
    logger.error(`Erro ao atualizar medalha ${req.params.medalId}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      medalId: req.params.medalId,
      body: req.body
    });
    res.status(500).json({ message: 'Erro interno ao atualizar medalha' });
  }
};

/**
 * @function deleteMedal
 * @description Controladora para deletar uma medalha do sistema (gerenciamento).
 * Identifica a medalha pelo seu `id` (string/slug).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.medalId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com mensagem de sucesso (200) ou erro (404, 500).
 */
export const deleteMedal = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { medalId } = req.params; // ID legível (slug) da medalha a ser deletada.
    logger.info(`Requisição para deletar medalha: ${medalId}`);

    // Tenta deletar a medalha que corresponde ao ID (slug).
    const result = await Medal.deleteOne({ id: medalId });

    // Verifica se alguma medalha foi deletada.
    if (result.deletedCount === 0) {
      logger.warn(`Tentativa de deletar medalha não encontrada: ${medalId}`);
      // Retorna 404 Not Found se a medalha não existia.
      res.status(404).json({ message: 'Medalha não encontrada' });
      return;
    }

    // Opcional: Remover as entradas correspondentes na coleção 'user_medals'.
    // Se uma medalha é deletada, faz sentido remover as instâncias dela dos usuários.
    // Descomentar e testar se esta lógica for desejada.
    /*
    const userMedalsCollection = await getCollection('user_medals');
    const deleteUserMedalsResult = await userMedalsCollection.deleteMany({ medalId });
    logger.info(`Removidas ${deleteUserMedalsResult.deletedCount} entradas de user_medals para a medalha ${medalId}`);
    */

    logger.info(`Medalha deletada com sucesso: ${medalId}`);
    // Responde com 200 OK e uma mensagem de sucesso. (Poderia ser 204 No Content também).
    res.status(200).json({ message: 'Medalha deletada com sucesso' });

  } catch (error: unknown) {
    // Captura e loga erros gerais.
    logger.error(`Erro ao deletar medalha ${req.params.medalId}`, { error: error instanceof Error ? error.message : String(error) });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro interno ao deletar medalha' });
  }
}; 