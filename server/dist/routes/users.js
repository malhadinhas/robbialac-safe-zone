"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Listar todos os usuários
router.get('/', async (req, res) => {
    try {
        const users = await User_1.default.find().select('-password');
        res.json(users);
    }
    catch (error) {
        logger_1.default.error('Erro ao listar usuários:', error);
        res.status(500).json({ message: 'Erro ao listar usuários' });
    }
});
// Obter usuário por ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }
        res.json(user);
    }
    catch (error) {
        logger_1.default.error('Erro ao obter usuário:', error);
        res.status(500).json({ message: 'Erro ao obter usuário' });
    }
});
// Buscar um usuário por email
router.get('/email/:email', userController_1.getUserByEmail);
// Criar um novo usuário
router.post('/', userController_1.createUser);
// Atualizar um usuário
router.put('/:id', userController_1.updateUser);
// Excluir um usuário
router.delete('/:id', userController_1.deleteUser);
// Atualizar o role de um usuário (apenas admin_app)
router.patch('/:id/role', (0, authMiddleware_1.hasRole)(['admin_app']), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    console.log('Alterando role do utilizador:', { id, role });
    if (!['admin_app', 'admin_qa', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Role inválido' });
    }
    try {
        const user = await User_1.default.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        user.role = role;
        await user.save();
        res.json({ message: 'Role atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar role:', error);
        res.status(500).json({ error: 'Erro ao atualizar role' });
    }
});
exports.default = router;
