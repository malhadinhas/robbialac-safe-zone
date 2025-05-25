"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.login = login;
exports.getCurrentUser = getCurrentUser;
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = require("mongoose");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
async function getUsers(req, res) {
    try {
        const users = await User_1.default.find().select('-password').lean();
        logger_1.default.info(`Usuários recuperados: ${users.length}`);
        res.json(users);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar usuários:', error);
        res.status(500).json({ message: 'Erro ao recuperar usuários' });
    }
}
async function getUserById(req, res) {
    try {
        const { id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de acesso com ID inválido', { id });
            res.status(400).json({ message: 'ID de usuário inválido' });
            return;
        }
        const user = await User_1.default.findById(id).select('-password').lean();
        if (!user) {
            logger_1.default.warn('Usuário não encontrado', { id });
            res.status(404).json({ message: 'Usuário não encontrado' });
            return;
        }
        logger_1.default.info('Usuário encontrado', { id });
        res.json(user);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter usuário:', error);
        res.status(500).json({ message: 'Erro ao obter usuário' });
    }
}
async function createUser(req, res) {
    try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password) {
            logger_1.default.warn('Tentativa de criar usuário com dados incompletos');
            res.status(400).json({ message: 'Nome, email e senha são obrigatórios' });
            return;
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            logger_1.default.warn('Tentativa de criar usuário com email já existente', { email });
            res.status(400).json({ message: 'Email já cadastrado' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = new User_1.default({
            name,
            email,
            password: hashedPassword,
            role: role || 'user'
        });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        logger_1.default.info('Usuário criado com sucesso', { id: user._id });
        res.status(201).json({
            message: 'Usuário criado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro ao criar usuário' });
    }
}
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, email, password, role } = req.body;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de atualizar usuário com ID inválido', { id });
            res.status(400).json({ message: 'ID de usuário inválido' });
            return;
        }
        const user = await User_1.default.findById(id);
        if (!user) {
            logger_1.default.warn('Usuário não encontrado para atualização', { id });
            res.status(404).json({ message: 'Usuário não encontrado' });
            return;
        }
        if (email && email !== user.email) {
            const existingUser = await User_1.default.findOne({ email });
            if (existingUser) {
                logger_1.default.warn('Tentativa de atualizar email para um já existente', { email });
                res.status(400).json({ message: 'Email já cadastrado' });
                return;
            }
            user.email = email;
        }
        if (name)
            user.name = name;
        if (role)
            user.role = role;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            user.password = await bcryptjs_1.default.hash(password, salt);
        }
        await user.save();
        logger_1.default.info('Usuário atualizado com sucesso', { id });
        res.json({
            message: 'Usuário atualizado com sucesso',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro ao atualizar usuário' });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            logger_1.default.warn('Tentativa de excluir usuário com ID inválido', { id });
            res.status(400).json({ message: 'ID de usuário inválido' });
            return;
        }
        const user = await User_1.default.findByIdAndDelete(id);
        if (!user) {
            logger_1.default.warn('Usuário não encontrado para exclusão', { id });
            res.status(404).json({ message: 'Usuário não encontrado' });
            return;
        }
        logger_1.default.info('Usuário excluído com sucesso', { id });
        res.json({ message: 'Usuário excluído com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir usuário:', error);
        res.status(500).json({ message: 'Erro ao excluir usuário' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            logger_1.default.warn('Tentativa de login com dados incompletos');
            res.status(400).json({ message: 'Email e senha são obrigatórios' });
            return;
        }
        const user = await User_1.default.findOne({ email });
        if (!user) {
            logger_1.default.warn('Tentativa de login com email não cadastrado', { email });
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_1.default.warn('Tentativa de login com senha incorreta', { email });
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        logger_1.default.info('Login realizado com sucesso', { id: user._id });
        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao realizar login:', error);
        res.status(500).json({ message: 'Erro ao realizar login' });
    }
}
async function getCurrentUser(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            logger_1.default.warn('Tentativa de obter usuário atual sem autenticação');
            res.status(401).json({ message: 'Não autorizado' });
            return;
        }
        const user = await User_1.default.findById(userId).select('-password').lean();
        if (!user) {
            logger_1.default.warn('Usuário atual não encontrado', { id: userId });
            res.status(404).json({ message: 'Usuário não encontrado' });
            return;
        }
        logger_1.default.info('Usuário atual recuperado com sucesso', { id: userId });
        res.json(user);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter usuário atual:', error);
        res.status(500).json({ message: 'Erro ao obter usuário atual' });
    }
}
// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de utilizadores para a API.
// Permite: listar, obter, criar, atualizar e eliminar utilizadores na base de dados.
// Cada função trata de um endpoint RESTful e faz validação básica e logging.
// O objetivo é centralizar toda a lógica de manipulação de utilizadores neste módulo. 
