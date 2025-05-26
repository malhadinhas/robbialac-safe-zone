"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.sendVerificationCode = sendVerificationCode;
exports.register = register;
exports.verifyEmail = verifyEmail;
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const email_1 = require("../services/email");
// Armazenamento temporário em memória para códigos de verificação (em produção, usar Redis ou BD)
const pendingVerifications = new Map();
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: 'Credenciais inválidas' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        logger_1.default.error('Erro ao fazer login:', error);
        res.status(500).json({ message: 'Erro ao fazer login' });
    }
}
async function sendVerificationCode(req, res) {
    const { email, name, password } = req.body;
    if (!email || !name || !password) {
        res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
        return;
    }
    if (!email.endsWith('@robbialac.pt')) {
        res.status(400).json({ error: 'Só são permitidos emails @robbialac.pt' });
        return;
    }
    const existingUser = await User_1.default.findOne({ email });
    if (existingUser) {
        res.status(400).json({ error: 'Email já cadastrado' });
        return;
    }
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    pendingVerifications.set(email, { name, password, verificationCode, createdAt: Date.now() });
    await (0, email_1.sendVerificationEmail)(email, verificationCode);
    res.json({ message: 'Código de verificação enviado para seu email' });
}
async function register(req, res) {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'Email já cadastrado' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = new User_1.default({ name, email, password: hashedPassword });
        await user.save();
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }
    catch (error) {
        logger_1.default.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro ao registrar usuário' });
    }
}
async function verifyEmail(req, res) {
    const { email, code } = req.body;
    if (!email || !code) {
        res.status(400).json({ error: 'Email e código são obrigatórios' });
        return;
    }
    const user = await User_1.default.findOne({ email });
    if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
    }
    if (user.isVerified) {
        res.status(400).json({ error: 'Usuário já verificado' });
        return;
    }
    if (user.verificationCode !== code) {
        res.status(400).json({ error: 'Código de verificação inválido' });
        return;
    }
    await User_1.default.updateOne({ email }, { $set: { isVerified: true }, $unset: { verificationCode: '' } });
    res.json({ message: 'Email verificado com sucesso!' });
}
