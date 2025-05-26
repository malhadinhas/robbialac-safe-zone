"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Listar todos os usuários
router.get('/', userController_1.listUsers);
// Obter usuário por ID
router.get('/:id', userController_1.getUserByIdHandler);
// Criar um novo usuário
router.post('/', userController_1.createUser);
// Atualizar um usuário
router.put('/:id', userController_1.updateUser);
// Excluir um usuário
router.delete('/:id', userController_1.deleteUser);
// Atualizar o role de um usuário (apenas admin_app)
router.patch('/:id/role', (0, authMiddleware_1.hasRole)(['admin_app']), userController_1.updateUserRoleHandler);
exports.default = router;
