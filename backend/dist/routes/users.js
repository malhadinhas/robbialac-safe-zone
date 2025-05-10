"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const mongodb_1 = require("mongodb");
const database_1 = require("../services/database");
const router = (0, express_1.Router)();
// Listar todos os usuários
router.get('/', userController_1.getUsers);
// Buscar um usuário específico por ID
router.get('/:id', userController_1.getUserById);
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
        const collection = await (0, database_1.getCollection)('users');
        let objectId;
        try {
            objectId = new mongodb_1.ObjectId(id);
        }
        catch (e) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const result = await collection.updateOne({ _id: objectId }, { $set: { role } });
        console.log('Resultado do updateOne:', result);
        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ message: 'Role atualizado com sucesso' });
    }
    catch (error) {
        console.error('Erro ao atualizar role:', error);
        res.status(500).json({ error: 'Erro ao atualizar role' });
    }
});
exports.default = router;
