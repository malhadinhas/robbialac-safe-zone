"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCredentials = validateCredentials;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.createUser = createUser;
exports.validateToken = validateToken;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 10;
async function validateCredentials(email, password) {
    // ---- REMOVER DEBUG LOGS DIRETOS ---- 
    // console.log(`[validateCredentials - Direct Log] Received Email: ${email}`);
    // console.log(`[validateCredentials - Direct Log] Received Password: ${password}`); 
    // ---- FIM REMOVER DEBUG LOGS DIRETOS ----
    logger_1.default.info('[validateCredentials] Attempting login for:', { email });
    logger_1.default.info('[validateCredentials] Password received (length):', password ? password.length : 'undefined/empty');
    try {
        const user = await User_1.default.findOne({ email });
        if (!user) {
            logger_1.default.warn('[validateCredentials] User not found in DB', { email });
            return null;
        }
        logger_1.default.info('[validateCredentials] User found in DB:', { userId: user.id, userEmail: user.email });
        logger_1.default.info('[validateCredentials] Stored password hash:', user.password);
        // ---- REMOVER DEBUG LOG DIRETO --- 
        // console.log(`[validateCredentials - Direct Log] Stored Hash: ${user.password}`);
        // ---- FIM REMOVER DEBUG LOG DIRETO ---
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        logger_1.default.info('[validateCredentials] bcryptjs.compare result:', { isValid });
        if (!isValid) {
            logger_1.default.warn('Tentativa de login falhou: Senha inválida (bcryptjs compare returned false)', { email });
            return null;
        }
        // Login bem-sucedido, registar evento
        try {
            const loginEventsCollection = await types_1.LoginEvent.find();
            const newLoginEvent = {
                userId: user.id,
                userEmail: user.email,
                timestamp: new Date(),
                // ipAddress: req?.ip, // TODO: Passar req para obter IP
                // userAgent: req?.headers['user-agent'] // TODO: Passar req para obter User Agent
            };
            await loginEventsCollection.insertOne(newLoginEvent);
            logger_1.default.info('Evento de login registado com sucesso', { userId: user.id, email: user.email });
        }
        catch (logError) {
            // Não impedir o login se o registo do evento falhar, apenas logar o erro
            logger_1.default.error('Falha ao registar evento de login', { userId: user.id, email: user.email, error: logError.message });
        }
        // Não retornar o hash da senha
        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error('Erro durante validação de credenciais', { email, error: error.message });
        throw error; // Re-lança o erro para ser tratado pela rota
    }
}
function generateToken(user) {
    // Convertendo ObjectId para string para incluir no token
    const userIdString = user._id.toString();
    return jsonwebtoken_1.default.sign({
        id: userIdString, // <<< CORRIGIDO: Usar o _id convertido para string
        email: user.email,
        role: user.role,
        name: user.name || 'Utilizador Desconhecido' // <<< ADICIONADO: Incluir nome do user
    }, JWT_SECRET, { expiresIn: '24h' });
}
async function verifyToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        return null;
    }
}
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function createUser(userData) {
    try {
        // Verificar se o email já existe
        const existingUser = await User_1.default.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('Email já cadastrado');
        }
        // Hash da senha
        const hashedPassword = await hashPassword(userData.password);
        const newUser = {
            id: new Date().getTime().toString(), // Pode ser substituído por um UUID
            ...userData,
            password: hashedPassword
        };
        const created = await User_1.default.create(newUser);
        const userObj = created.toObject();
        // Não retornar o hash da senha
        const { password: _, ...userWithoutPassword } = userObj;
        return userWithoutPassword;
    }
    catch (error) {
        console.error('Erro ao criar usuário:', error);
        throw error;
    }
}
async function validateToken(token) {
    try {
        const decoded = await verifyToken(token);
        if (!decoded) {
            return false;
        }
        const user = await User_1.default.findOne({ id: decoded.id });
        return !!user;
    }
    catch (error) {
        return false;
    }
}
