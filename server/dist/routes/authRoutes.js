"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logger_1 = __importDefault(require("../utils/logger"));
const email_1 = require("../services/email");
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
/**
 * Rota para login de utilizador.
 * Recebe email e password no corpo da requisição.
 * Retorna dados do utilizador (sem password) e token JWT em caso de sucesso.
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        logger_1.default.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
});
// Armazenamento temporário em memória para códigos de verificação (em produção, use Redis ou banco)
const pendingVerifications = new Map();
// Endpoint para enviar código de verificação
router.post('/send-code', async (req, res) => {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }
    if (!email.endsWith('@robbialac.pt')) {
        return res.status(400).json({ error: 'Só são permitidos emails @robbialac.pt' });
    }
    // Verifica se já existe usuário com esse email
    const users = await User_1.default.find();
    const existingUser = await User_1.default.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ error: 'Email já cadastrado' });
    }
    // Gerar código de verificação
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    // Salvar temporariamente os dados
    pendingVerifications.set(email, { name, password, verificationCode, createdAt: Date.now() });
    // Enviar email
    await (0, email_1.sendVerificationEmail)(email, verificationCode);
    res.json({ message: 'Código de verificação enviado para seu email' });
});
// Endpoint para criar usuário após verificação
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email já cadastrado' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = new User_1.default({ name, email, password: hashedPassword });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        logger_1.default.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
});
// Endpoint para verificação de email
router.post('/verify-email', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'Email e código são obrigatórios' });
    }
    const users = await User_1.default.find();
    const user = await User_1.default.findOne({ email });
    if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    if (user.isVerified) {
        return res.status(400).json({ error: 'Usuário já verificado' });
    }
    if (user.verificationCode !== code) {
        return res.status(400).json({ error: 'Código de verificação inválido' });
    }
    await User_1.default.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationCode: '' } });
    res.json({ message: 'Email verificado com sucesso!' });
});
// TODO: Adicionar rota para validar token (ex: /validate-token)
// TODO: Adicionar rota para refresh token (se necessário)
exports.default = router;
