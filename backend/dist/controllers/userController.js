"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const database_1 = require("../services/database"); // Função para obter uma coleção da base de dados
const auth_1 = require("../services/auth"); // Função para fazer hash da password
const logger_1 = __importDefault(require("../utils/logger")); // Logger para registar informações e erros
const mongodb_1 = require("mongodb");
const email_1 = require("../services/email");
// Função para obter todos os utilizadores
async function getUsers(req, res) {
    try {
        const collection = await (0, database_1.getCollection)('users'); // Obtém a coleção 'users'
        const users = await collection.find({}).toArray(); // Busca todos os utilizadores
        res.json(users); // Retorna a lista de utilizadores
    }
    catch (error) {
        console.error('Erro ao buscar usuários:', error); // Log de erro
        res.status(500).json({ error: 'Erro ao buscar usuários' }); // Retorna erro 500
    }
}
// Função para obter um utilizador pelo ID
async function getUserById(req, res) {
    try {
        const { id } = req.params; // Extrai o id dos parâmetros da rota
        const collection = await (0, database_1.getCollection)('users'); // Obtém a coleção 'users'
        let user = null;
        try {
            user = await collection.findOne({ _id: new mongodb_1.ObjectId(id) });
        }
        catch (e) {
            // id não é um ObjectId válido
            return res.status(400).json({ error: 'ID inválido' });
        }
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
        }
        // Mapeamento _id -> _id
        const { _id, ...userWithoutMongoId } = user;
        res.json(userWithoutMongoId); // Retorna o utilizador encontrado sem _id
    }
    catch (error) {
        console.error('Erro ao buscar usuário:', error); // Log de erro
        res.status(500).json({ error: 'Erro ao buscar usuário' }); // Retorna erro 500
    }
}
// Função para obter um utilizador pelo email
async function getUserByEmail(req, res) {
    try {
        const { email } = req.params; // Extrai o email dos parâmetros da rota
        const collection = await (0, database_1.getCollection)('users'); // Obtém a coleção 'users'
        const user = await collection.findOne({ email }); // Procura o utilizador pelo email
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
        }
        // Mapeamento _id -> id
        const { _id, ...userWithoutMongoId } = user;
        res.json(userWithoutMongoId); // Retorna o utilizador encontrado sem _id
    }
    catch (error) {
        console.error('Erro ao buscar usuário por email:', error); // Log de erro
        res.status(500).json({ error: 'Erro ao buscar usuário' }); // Retorna erro 500
    }
}
// Função para criar um novo utilizador
async function createUser(req, res) {
    try {
        const { email, password, ...restData } = req.body; // Extrai email, password e outros dados do corpo do pedido
        // Validação básica dos campos obrigatórios
        if (!email || !password) {
            logger_1.default.warn('Tentativa de criar utilizador sem email ou password');
            return res.status(400).json({ error: 'Email e password são obrigatórios' }); // Retorna erro 400 se faltar algum campo
        }
        const collection = await (0, database_1.getCollection)('users'); // Obtém a coleção 'users'
        // Verifica se já existe um utilizador com o mesmo email
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            logger_1.default.warn('Tentativa de criar utilizador com email já existente', { email });
            return res.status(400).json({ error: 'Email já cadastrado' }); // Retorna erro 400 se o email já existir
        }
        // Faz hash da password antes de guardar
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Gerar código de verificação de 6 dígitos
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        // Cria o novo utilizador com valores padrão e campos de verificação
        const newUser = {
            email,
            password: hashedPassword,
            ...restData,
            id: crypto.randomUUID(), // Gera um ID único
            points: 100, // Pontos iniciais
            level: 1, // Nível inicial
            medals: [],
            viewedVideos: [],
            reportedIncidents: [],
            verificationCode,
            isVerified: false
        };
        await collection.insertOne(newUser); // Insere o novo utilizador na base de dados
        logger_1.default.info('Novo utilizador criado com sucesso', { email });
        // Enviar email de verificação
        await (0, email_1.sendVerificationEmail)(email, verificationCode);
        logger_1.default.info('Email de verificação enviado', { email });
        // Remove a password e o código do objeto antes de devolver ao frontend
        const { password: _, verificationCode: __, ...userToReturn } = newUser;
        res.status(201).json(userToReturn); // Retorna o utilizador criado (sem password/código)
    }
    catch (error) {
        logger_1.default.error('Erro ao criar utilizador', { error: error.message, stack: error.stack }); // Log de erro
        res.status(500).json({ error: 'Erro ao criar utilizador' }); // Retorna erro 500
    }
}
// Função para atualizar um utilizador existente
async function updateUser(req, res) {
    try {
        const { id } = req.params; // id é o _id do MongoDB
        const updateData = req.body;
        const collection = await (0, database_1.getCollection)('users');
        let objectId;
        try {
            objectId = new mongodb_1.ObjectId(id);
        }
        catch (e) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        // Atualiza o utilizador pelo _id
        const result = await collection.updateOne({ _id: objectId }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Usuário atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
}
// Função para eliminar um utilizador
async function deleteUser(req, res) {
    try {
        const { id } = req.params; // Extrai o id dos parâmetros da rota
        const collection = await (0, database_1.getCollection)('users'); // Obtém a coleção 'users'
        // Elimina o utilizador pelo id
        const result = await collection.deleteOne({ id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
        }
        res.json({ message: 'Usuário excluído com sucesso' }); // Retorna mensagem de sucesso
    }
    catch (error) {
        console.error('Erro ao excluir usuário:', error); // Log de erro
        res.status(500).json({ error: 'Erro ao excluir usuário' }); // Retorna erro 500
    }
}
// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de utilizadores para a API.
// Permite: listar, obter, criar, atualizar e eliminar utilizadores na base de dados.
// Cada função trata de um endpoint RESTful e faz validação básica e logging.
// O objetivo é centralizar toda a lógica de manipulação de utilizadores neste módulo. 
