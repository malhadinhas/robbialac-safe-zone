import { Request, Response } from 'express';
import Like from '../models/Like';
import Comment from '../models/Comment';
import { isValidObjectId } from 'mongoose';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb'; // Import ObjectId

// Helper function to validate item type
const isValidItemType = (type: string): type is 'qa' | 'accident' | 'sensibilizacao' => {
    return ['qa', 'accident', 'sensibilizacao'].includes(type);
};

// --- Like Functions ---

export const addLike = async (req: Request, res: Response) => {
    // 1. Get userId from req.user (assuming middleware added it)
    // Adjust '.id' if your user object structure is different
    const userId = req.user?.id; 
    if (!userId) {
        return res.status(401).json({ message: 'Utilizador não autenticado.' });
    }
    
    // 2. Get itemId, itemType from req.body
    const { itemId, itemType } = req.body;

    // 3. Validate itemId and itemType
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('Tentativa de adicionar like com dados inválidos', { body: req.body, userId });
        return res.status(400).json({ message: 'Dados inválidos para adicionar like.' });
    }

    try {
        // 4. Create and save a new Like document
        // Use findOneAndUpdate with upsert to handle creation and avoid duplicates atomically
        const likeData = { userId: new ObjectId(userId), itemId: new ObjectId(itemId), itemType };
        
        // Attempt to create/update the like document.
        // If a document with this userId, itemId, itemType already exists, it won't be modified 
        // due to the unique index. If it doesn't exist, it will be inserted.
        await Like.findOneAndUpdate(
            likeData, // Find based on the unique combination
            { $setOnInsert: likeData }, // Set data only on insert
            { upsert: true, new: false, runValidators: true } // upsert=true creates if not found
        );

        logger.info('Like adicionado/confirmado com sucesso', { userId, itemId, itemType });
        // 5. Return success (201 Created if new, 200 OK if already existed - simpler to return 200 always)
        res.status(200).json({ message: 'Like registado com sucesso.' });

    } catch (error: any) {
        // Handle potential unique constraint violation (already liked) - though upsert should handle this
        if (error.code === 11000) { 
            logger.warn('Like duplicado ignorado', { userId, itemId, itemType });
            return res.status(200).json({ message: 'Já gostou deste item.' });
        }
        logger.error('Erro ao adicionar like', { userId, itemId, itemType, error: error.message });
        res.status(500).json({ message: 'Erro ao adicionar like.', details: error.message });
    }
};

export const removeLike = async (req: Request, res: Response) => {
    // 1. Get userId from req.user
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ message: 'Utilizador não autenticado.' });
    }
    
    // 2. Get itemId, itemType from req.body (Using body for DELETE might be unconventional, query params preferred)
    // Let's assume body for consistency with addLike for now.
    const { itemId, itemType } = req.body; 

    // 3. Validate itemId and itemType
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('Tentativa de remover like com dados inválidos', { body: req.body, userId });
        return res.status(400).json({ message: 'Dados inválidos para remover like.' });
    }

    try {
        // 4. Find and delete the Like document
        const result = await Like.deleteOne({ 
            userId: new ObjectId(userId), 
            itemId: new ObjectId(itemId), 
            itemType 
        });

        // 5. Return success or error (like not found)
        if (result.deletedCount === 0) {
            logger.warn('Like não encontrado para remoção', { userId, itemId, itemType });
            return res.status(404).json({ message: 'Like não encontrado.' });
        }

        logger.info('Like removido com sucesso', { userId, itemId, itemType });
        res.status(200).json({ message: 'Like removido com sucesso.' }); // 200 OK or 204 No Content

    } catch (error: any) {
        logger.error('Erro ao remover like', { userId, itemId, itemType, error: error.message });
        res.status(500).json({ message: 'Erro ao remover like.', details: error.message });
    }
};

// --- Comment Functions --- 

export const addComment = async (req: Request, res: Response) => {
    // 1. Get userId and userName from req.user (assuming middleware provides name)
    const userId = req.user?.id;
    // Ler o nome do utilizador a partir do token (req.user)
    const userName = req.user?.name || 'Utilizador Desconhecido'; // Fallback se o nome não estiver no token
    
    if (!userId) {
        logger.warn('addComment: Utilizador não autenticado (sem userId em req.user)');
        return res.status(401).json({ message: 'Utilizador não autenticado.' });
    }
    // Log para confirmar que o nome está a ser lido corretamente do token
    logger.info('addComment: Dados do utilizador obtidos', { userId, userNameFromToken: req.user?.name });

    // 2. Get itemId, itemType, text from req.body
    const { itemId, itemType, text } = req.body;

    // 3. Validate inputs
    if (!itemId || !itemType || !text || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('Tentativa de adicionar comentário com dados inválidos', { body: req.body, userId });
        return res.status(400).json({ message: 'Dados inválidos para adicionar comentário.' });
    }

    if (text.trim().length === 0 || text.length > 500) { // Check length limits
        logger.warn('Comentário vazio ou muito longo', { userId, itemId, length: text.length });
        return res.status(400).json({ message: 'Comentário vazio ou excede 500 caracteres.' });
    }

    try {
        // 4. Create and save a new Comment document
        const newComment = new Comment({
            userId: new ObjectId(userId),
            userName: userName, // Guardar o nome obtido do token
            itemId: new ObjectId(itemId),
            itemType: itemType,
            text: text.trim()
            // createdAt will be added automatically by timestamps
        });
        
        await newComment.save();
        logger.info('Comentário adicionado com sucesso', { userId, itemId, itemType, commentId: newComment._id });

        // 5. Format and return the newly created comment
        // Criar o objeto de resposta no formato esperado pelo frontend
        const responseComment = {
            _id: newComment._id.toString(),
            user: {
                _id: newComment.userId.toString(), // Converter ObjectId para string
                name: newComment.userName // Usar o nome guardado
            },
            text: newComment.text,
            createdAt: newComment.createdAt // createdAt já é Date
            // Incluir itemType e itemId se necessário no frontend?
            // itemId: newComment.itemId.toString(),
            // itemType: newComment.itemType
        };

        res.status(201).json(responseComment); // <<< Enviar o objeto formatado

    } catch (error: any) {
        logger.error('Erro ao adicionar comentário', { userId, itemId, itemType, error: error.message });
        res.status(500).json({ message: 'Erro ao adicionar comentário.', details: error.message });
    }
};

export const getCommentsByItem = async (req: Request, res: Response) => {
    // 1. Get itemId, itemType from req.params
    const { itemId, itemType } = req.params;
    // Get pagination from query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10; // Default 10 comments per page
    const skip = (page - 1) * limit;

    // 2. Validate itemId and itemType
    if (!itemId || !itemType || !isValidObjectId(itemId) || !isValidItemType(itemType)) {
        logger.warn('Tentativa de buscar comentários com dados inválidos', { params: req.params });
        return res.status(400).json({ message: 'Dados inválidos para buscar comentários.' });
    }
    
    if (page <= 0 || limit <= 0) {
        return res.status(400).json({ message: 'Paginação inválida.' });
    }

    try {
        // 3. Find comments matching itemId and itemType
        const query = { itemId: new ObjectId(itemId), itemType: itemType };

        const comments = await Comment.find(query)
            .sort({ createdAt: -1 }) // Sort by most recent first
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for performance if not modifying docs

        // 4. Get total count for pagination headers (optional but good practice)
        const totalComments = await Comment.countDocuments(query);

        logger.info(`Buscando comentários para ${itemType} ${itemId}`, { page, limit, found: comments.length, total: totalComments });
        
        // 5. Return the list of comments and total count
        res.status(200).json({
            comments,
            currentPage: page,
            totalPages: Math.ceil(totalComments / limit),
            totalComments
        });

    } catch (error: any) {
        logger.error('Erro ao buscar comentários', { itemId, itemType, error: error.message });
        res.status(500).json({ message: 'Erro ao buscar comentários.', details: error.message });
    }
}; 