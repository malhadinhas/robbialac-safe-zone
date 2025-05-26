"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
exports.setMongoClient = setMongoClient;
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = express_1.default.Router();
exports.userRoutes = router;
let mongoClient;
function setMongoClient(client) {
    mongoClient = client;
}
// Login do usuário
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await mongoClient
            .db()
            .collection('users')
            .findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Usuário não encontrado' });
        }
        const isValidPassword = await bcrypt_1.default.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Senha incorreta' });
        }
        // Remove o campo password antes de enviar
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});
// Buscar usuário por email
router.get('/:email', async (req, res) => {
    try {
        const user = await mongoClient
            .db()
            .collection('users')
            .findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        // Remove o campo password antes de enviar
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});
// Criar novo usuário
router.post('/', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        // Verifica se já existe um usuário com este email
        const existingUser = await mongoClient
            .db()
            .collection('users')
            .findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        // Criptografa a senha
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Cria o novo usuário
        const result = await mongoClient
            .db()
            .collection('users')
            .insertOne({
            email,
            password: hashedPassword,
            name,
            role,
            createdAt: new Date()
        });
        const newUser = {
            _id: result.insertedId,
            email,
            name,
            role,
            createdAt: new Date()
        };
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário' });
    }
});
// Atualizar usuário
router.put('/:id', async (req, res) => {
    try {
        const { name, role, password } = req.body;
        const updateData = { name, role };
        // Se uma nova senha foi fornecida, criptografa ela
        if (password) {
            updateData.password = await bcrypt_1.default.hash(password, 10);
        }
        const result = await mongoClient
            .db()
            .collection('users')
            .updateOne({ _id: new mongodb_1.ObjectId(req.params.id) }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});
// Deletar usuário
router.delete('/:id', async (req, res) => {
    try {
        const result = await mongoClient
            .db()
            .collection('users')
            .deleteOne({ _id: new mongodb_1.ObjectId(req.params.id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});
