/**
 * @module server/controllers/interactionController
 * @description Este módulo contém as funções controladoras (handlers) para as rotas da API
 * relacionadas às interações do usuário com diferentes tipos de itens na plataforma,
 * especificamente 'likes' (gostos) e 'comments' (comentários).
 * Ele lida com a criação e remoção de likes, e a adição e busca de comentários
 * associados a itens identificados por `itemId` e `itemType`.
 */
import { Request, Response } from 'express';
import Like from '../models/Like';        // Modelo Mongoose para Likes
import Comment from '../models/Comment';    // Modelo Mongoose para Comentários
import { isValidObjectId } from 'mongoose'; // Função do Mongoose para validar formato de ObjectId
import logger from '../utils/logger';     // Utilitário de logging
import { ObjectId } from 'mongodb';         // Tipo ObjectId do MongoDB/Mongoose
import { registerActivityData } from './activityController';
import Accident from '../models/Accident';
import Sensibilizacao from '../models/Sensibilizacao';
import Incident from '../models/Incident';
import { AuthenticatedRequest } from '../types/express';

/**
 * @function isValidItemType
 * @description Função auxiliar para validar se o tipo de item fornecido é um dos permitidos
 * para interação ('qa', 'accident', 'sensibilizacao').
 * Usa um type predicate (`is`) para refinar o tipo de `type` se a função retornar true.
 * @param {string} type - O tipo de item a ser validado.
 * @returns {type is 'qa' | 'accident' | 'sensibilizacao'} - Retorna true se o tipo for válido, false caso contrário.
 */
const isValidItemType = (type: string): type is 'qa' | 'accident' | 'sensibilizacao' => {
    // Verifica se o tipo está incluído no array de tipos válidos.
    return ['qa', 'accident', 'sensibilizacao'].includes(type);
};

// --- Funções relacionadas a Likes ---

/**
 * @function addLike
 * @description Controladora para adicionar um 'like' a um item específico.
 * Garante que um usuário só possa dar like uma vez em um item.
 * Utiliza `findOneAndUpdate` com `upsert` para uma operação atômica.
 * @param {Request & { user?: { id: string } }} req - Objeto da requisição Express. Espera `req.user.id` (do middleware de auth)
 *                                                   e `req.body` com `itemId` e `itemType`.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com sucesso (200) ou erro (400, 401, 500).
 */
export const addLike = async (req: Request, res: Response): Promise<void> => {
    // 1. Obter ID do usuário da requisição (assumindo que o middleware de autenticação adicionou `req.user`).
    //    Acessa `req.user?.id` - o `?` previne erro se `req.user` não existir.
    const userId = req.user?.userId;
    // Se não houver ID de usuário, retorna erro 401 Unauthorized.
    if (!userId) {
        logger.warn('addLike: Tentativa de adicionar like sem autenticação.');
        res.status(401).json({ message: 'Utilizador não autenticado.' });
        return;
    }

    // 2. Obter ID do item e tipo do item do corpo da requisição.
    const { itemId, itemType } = req.body;

    // 3. Validar os dados recebidos:
    //    - `itemId` e `itemType` devem existir.
    //    - `itemId` deve ser um ObjectId válido do Mongoose.
    //    - `itemType` deve ser um dos tipos permitidos pela função auxiliar.
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('addLike: Tentativa com dados inválidos.', { body: req.body, userId });
        res.status(400).json({ message: 'Dados inválidos para adicionar like.' });
        return;
    }

    try {
        // 4. Preparar os dados para a operação no banco. Converte IDs para ObjectId.
        const likeData = {
            userId: new ObjectId(userId),
            itemId: new ObjectId(itemId),
            itemType
        };

        // 5. Tenta encontrar e atualizar (ou criar se não existir) o documento de like.
        //    - `findOneAndUpdate`: Busca um documento que corresponda ao primeiro argumento (`likeData`).
        //    - `{ $setOnInsert: likeData }`: Se o documento não for encontrado (será inserido), define os campos com base em `likeData`.
        //    - `{ upsert: true }`: Opção chave. Se nenhum documento corresponder ao filtro, um novo será criado.
        //    - `{ new: false }`: Não precisamos que retorne o documento (otimização).
        //    - `{ runValidators: true }`: Garante que as validações do schema Mongoose sejam executadas na inserção.
        //    Esta operação é atômica e eficiente para lidar com "gostar" ou confirmar que já gostou.
        //    O índice único no modelo Like (userId, itemId, itemType) previne a criação de duplicatas,
        //    mas o upsert por si só já lida bem com a lógica de "criar se não existir".
        await Like.findOneAndUpdate(
            likeData, // Critério de busca (encontrar like existente com esta combinação)
            { $setOnInsert: likeData }, // Dados a serem inseridos se não encontrado
            { upsert: true, new: false, runValidators: true } // Habilita upsert
        );

        // Buscar título do item para registo de atividade
        let itemTitle = '';
        if (itemType === 'qa') {
            const qa = await Incident.findOne({ _id: itemId });
            itemTitle = qa?.title || '';
        } else if (itemType === 'accident') {
            const accident = await Accident.findById(itemId).select('name');
            itemTitle = accident?.name || '';
        } else if (itemType === 'sensibilizacao') {
            const sensibilizacao = await Sensibilizacao.findById(itemId).select('name');
            itemTitle = sensibilizacao?.name || '';
        }

        // Registar atividade
        await registerActivityData({
            userId,
            category: itemType === 'qa' ? 'incident' : itemType === 'accident' ? 'incident' : 'training',
            activityId: itemId,
            points: 1,
            details: {
                action: 'like',
                itemType,
                itemTitle,
                userName: req.user?.name
            }
        });

        logger.info('Like adicionado/confirmado com sucesso.', { userId, itemId, itemType });
        // 6. Retorna sucesso. Usar 200 OK é mais simples do que diferenciar entre criação (201) e confirmação.
        res.status(200).json({ message: 'Like registado com sucesso.' });

    } catch (error: unknown) {
        if (typeof error === 'object' && error && 'code' in error && (error as { code: number }).code === 11000) {
            logger.warn('addLike: Like duplicado detectado (índice único).', { userId, itemId, itemType });
            res.status(200).json({ message: 'Já gostou deste item.' });
            return;
        }
        logger.error('Erro ao adicionar like:', { userId, itemId, itemType, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'Erro ao adicionar like.', details: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @function removeLike
 * @description Controladora para remover um 'like' de um item específico.
 * @param {Request & { user?: { id: string } }} req - Objeto da requisição Express. Espera `req.user.id` e `req.body` com `itemId` e `itemType`.
 *        (Nota: Usar DELETE com corpo é menos comum, query params seriam mais standard).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com sucesso (200) ou erro (400, 401, 404, 500).
 */
export const removeLike = async (req: Request, res: Response): Promise<void> => {
    // 1. Obter ID do usuário da requisição.
    const userId = req.user?.userId;
    if (!userId) {
        logger.warn('removeLike: Tentativa de remover like sem autenticação.');
        res.status(401).json({ message: 'Utilizador não autenticado.' });
        return;
    }

    // 2. Obter itemId e itemType do corpo da requisição (poderia ser de query params para DELETE).
    const { itemId, itemType } = req.body;

    // 3. Validar os dados recebidos.
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('removeLike: Tentativa com dados inválidos.', { body: req.body, userId });
        res.status(400).json({ message: 'Dados inválidos para remover like.' });
        return;
    }

    try {
        // 4. Tenta deletar o documento de Like que corresponde à combinação exata.
        const result = await Like.deleteOne({
            userId: new ObjectId(userId),
            itemId: new ObjectId(itemId),
            itemType
        });

        // 5. Verifica o resultado da deleção.
        //    `result.deletedCount` informa quantos documentos foram removidos.
        if (result.deletedCount === 0) {
            // Se nenhum documento foi removido, significa que o like não existia.
            logger.warn('removeLike: Like não encontrado para remoção.', { userId, itemId, itemType });
            // Retorna 404 Not Found.
            res.status(404).json({ message: 'Like não encontrado.' });
            return;
        }

        // Se deletedCount > 0, a remoção foi bem-sucedida.
        logger.info('Like removido com sucesso.', { userId, itemId, itemType });
        // Retorna 200 OK (ou poderia ser 204 No Content).
        res.status(200).json({ message: 'Like removido com sucesso.' });

    } catch (error: unknown) {
        logger.error('Erro ao remover like:', { userId, itemId, itemType, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'Erro ao remover like.', details: error instanceof Error ? error.message : String(error) });
    }
};

// --- Funções relacionadas a Comentários ---

/**
 * @function addComment
 * @description Controladora para adicionar um novo comentário a um item específico.
 * Obtém o nome do usuário do token (`req.user`) para associar ao comentário.
 * @param {Request & { user?: { id: string, name?: string } }} req - Objeto da requisição Express. Espera `req.user` (com `id` e `name`)
 *                                                                 e `req.body` com `itemId`, `itemType`, `text`.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o comentário criado (status 201) ou um erro (400, 401, 500).
 */
export const addComment = async (req: Request, res: Response): Promise<void> => {
    const { user } = req as unknown as AuthenticatedRequest;
    const userId = user?.userId;
    const userName = user?.name || 'Utilizador Desconhecido';

    if (!userId) {
        logger.warn('addComment: Utilizador não autenticado (sem userId em req.user).');
        res.status(401).json({ message: 'Utilizador não autenticado.' });
        return;
    }

    logger.info('addComment: Dados do utilizador obtidos do token.', { userId, userNameFromToken: req.user?.name, resolvedUserName: userName });

    // 2. Obter dados do comentário do corpo da requisição.
    const { itemId, itemType, text } = req.body;

    // 3. Validar os dados recebidos:
    //    - Campos obrigatórios (`itemId`, `itemType`, `text`).
    //    - Formato válido para `itemId` e `itemType`.
    if (!itemId || !itemType || !text || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('addComment: Tentativa com dados inválidos.', { body: req.body, userId });
        res.status(400).json({ message: 'Dados inválidos para adicionar comentário.' });
        return;
    }
    //    - Validação do comprimento do texto do comentário.
    if (!text || text.length === 0 || text.length > 500) {
        logger.warn('addComment: Comentário vazio ou muito longo.', { userId, itemId, length: text.length });
        res.status(400).json({ message: 'Comentário vazio ou excede 500 caracteres.' });
        return;
    }

    try {
        // 4. Criar uma nova instância do modelo Comment.
        const newComment = new Comment({
            userId: new ObjectId(userId), // Converte para ObjectId.
            userName: userName,           // Armazena o nome do usuário obtido.
            itemId: new ObjectId(itemId),   // Converte para ObjectId.
            itemType: itemType,
            text: text.trim()             // Remove espaços extras do texto.
            // O campo 'createdAt' (e 'updatedAt' se houver) é adicionado automaticamente
            // se a opção `timestamps: true` estiver no Schema Mongoose.
        });

        // 5. Salvar o novo comentário no banco de dados.
        await newComment.save();
        // LINTER ERROR: O tipo de newComment._id pode ser 'unknown' aqui para o TS.
        //               Verificar a definição do Model ou usar o retorno de save() se necessário.
        logger.info('Comentário adicionado com sucesso.', { userId, itemId, itemType, commentId: newComment._id?.toString() });

        // Buscar título do item para registo de atividade
        let itemTitle = '';
        if (itemType === 'qa') {
            const qa = await Incident.findOne({ _id: itemId });
            itemTitle = qa?.title || '';
        } else if (itemType === 'accident') {
            const accident = await Accident.findById(itemId).select('name');
            itemTitle = accident?.name || '';
        } else if (itemType === 'sensibilizacao') {
            const sensibilizacao = await Sensibilizacao.findById(itemId).select('name');
            itemTitle = sensibilizacao?.name || '';
        }

        // Registar atividade
        await registerActivityData({
            userId,
            category: itemType === 'qa' ? 'incident' : itemType === 'accident' ? 'incident' : 'training',
            activityId: itemId,
            points: 1,
            details: {
                action: 'comment',
                itemType,
                itemTitle,
                commentText: text.trim(),
                userName: req.user?.name
            }
        });

        // 6. Formatar e retornar o comentário recém-criado na resposta.
        //    É boa prática retornar o objeto criado para o frontend.
        const responseComment = {
             _id: newComment._id?.toString(), // Converte ObjectId para string (com optional chaining por causa do linter)
             // Estrutura o usuário aninhado como parece ser esperado pelo frontend.
             user: {
                 _id: newComment.userId.toString(), // Converte ObjectId do usuário para string.
                 name: newComment.userName          // Usa o nome armazenado no comentário.
             },
             text: newComment.text,
             createdAt: newComment.createdAt?.toISOString() // Converte Date para string ISO (com optional chaining)
             // Pode-se incluir itemId/itemType se o frontend precisar.
             // itemId: newComment.itemId.toString(),
             // itemType: newComment.itemType
        };

        // Responde com status 201 Created e o comentário formatado.
        res.status(201).json(responseComment);

    } catch (error: unknown) {
        logger.error('Erro ao adicionar comentário:', { userId, itemId, itemType, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'Erro ao adicionar comentário.', details: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @function getCommentsByItem
 * @description Controladora para buscar comentários associados a um item específico,
 * com suporte a paginação.
 * @param {Request} req - Objeto da requisição Express. Espera `req.params.itemId`, `req.params.itemType`
 *                        e opcionalmente `req.query.page`, `req.query.limit`.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um objeto contendo a lista de comentários e dados de paginação, ou um erro (400, 500).
 */
export const getCommentsByItem = async (req: Request, res: Response): Promise<void> => {
    // 1. Obter itemId e itemType dos parâmetros da rota.
    const { itemId, itemType } = req.params;
    // Obter parâmetros de paginação da query string, com valores padrão.
    const page = parseInt(req.query.page as string) || 1;    // Página atual (padrão 1).
    const limit = parseInt(req.query.limit as string) || 10; // Limite de comentários por página (padrão 10).
    const skip = (page - 1) * limit; // Calcula quantos documentos pular baseado na página e limite.

    // 2. Validar os dados recebidos.
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('getCommentsByItem: Tentativa com dados inválidos.', { params: req.params });
        res.status(400).json({ message: 'Dados inválidos para buscar comentários.' });
        return;
    }
    // Valida se os parâmetros de paginação são positivos.
    if (page <= 0 || limit <= 0) {
        logger.warn('getCommentsByItem: Paginação inválida.', { page, limit });
        res.status(400).json({ message: 'Paginação inválida.' });
        return;
    }

    try {
        // 3. Definir a query para buscar comentários que correspondam ao itemId e itemType.
        const query = { itemId: new ObjectId(itemId), itemType: itemType };

        // 4. Buscar os comentários no banco de dados:
        const comments = await Comment.find(query) // Aplica o filtro.
            .sort({ createdAt: -1 }) // Ordena pelos mais recentes primeiro.
            .skip(skip) // Pula os documentos das páginas anteriores.
            .limit(limit) // Limita o número de resultados à página atual.
            .lean(); // Usa .lean() para obter objetos JS puros (melhor performance se não for modificar).

        // 5. Contar o número total de comentários que correspondem à query (para calcular total de páginas).
        const totalComments = await Comment.countDocuments(query);

        logger.info(`Buscando comentários para ${itemType}/${itemId}`, { page, limit, foundCount: comments.length, totalCount: totalComments });

        // 6. Retornar a lista de comentários e informações de paginação.
        res.status(200).json({
            comments, // O array de comentários da página atual.
            currentPage: page, // A página atual que foi retornada.
            totalPages: Math.ceil(totalComments / limit), // O número total de páginas.
            totalComments // O número total de comentários para este item.
        });

    } catch (error: unknown) {
        logger.error('Erro ao buscar comentários:', { itemId, itemType, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
        res.status(500).json({ message: 'Erro ao buscar comentários.', details: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * @function getLikeInfo
 * @description Devolve o número de likes e se o utilizador autenticado já fez like num item.
 * @route GET /api/interactions/like/:itemType/:itemId
 */
export const getLikeInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { itemType, itemId } = req.params;
    const userId = req.user?.userId;
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
      return res.status(400).json({ message: 'Dados inválidos.' });
    }
    // Contar likes
    const likeCount = await Like.countDocuments({ itemId: new ObjectId(itemId), itemType });
    // Verificar se o utilizador já fez like
    let userHasLiked = false;
    if (userId) {
      const like = await Like.findOne({ itemId: new ObjectId(itemId), itemType, userId: new ObjectId(userId) });
      userHasLiked = !!like;
    }
    res.json({ likeCount, userHasLiked });
  } catch (error: unknown) {
    logger.error('Erro ao obter info de likes:', error instanceof Error ? { message: error.message, stack: error.stack } : { error });
    res.status(500).json({ message: 'Erro ao obter info de likes.' });
  }
}; 