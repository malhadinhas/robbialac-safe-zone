"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePasswords = exports.hashPassword = exports.verifyToken = exports.generateToken = void 0;
exports.validateCredentials = validateCredentials;
exports.createUser = createUser;
exports.validateToken = validateToken;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../utils/logger"));
const LoginEvent_1 = __importDefault(require("../models/LoginEvent"));
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
        const isValid = await bcrypt_1.default.compare(password, user.password);
        logger_1.default.info('[validateCredentials] bcryptjs.compare result:', { isValid });
        if (!isValid) {
            logger_1.default.warn('Tentativa de login falhou: Senha inválida (bcryptjs compare returned false)', { email });
            return null;
        }
        // Login bem-sucedido, registar evento
        try {
            await LoginEvent_1.default.create({
                userId: user.id,
                userEmail: user.email,
                timestamp: new Date(),
                // ipAddress: req?.ip, // TODO: Passar req para obter IP
                // userAgent: req?.headers['user-agent'] // TODO: Passar req para obter User Agent
            });
            logger_1.default.info('Evento de login registado com sucesso', { userId: user.id, email: user.email });
        }
        catch (logError) {
            // Não impedir o login se o registo do evento falhar, apenas logar o erro
            logger_1.default.error('Falha ao registar evento de login', { userId: user.id, email: user.email, error: logError instanceof Error ? logError.message : String(logError) });
        }
        // Não retornar o hash da senha
        const { password: _, ...userWithoutPassword } = user.toObject();
        return userWithoutPassword;
    }
    catch (error) {
        logger_1.default.error('Erro durante validação de credenciais', { email, error: error instanceof Error ? error.message : String(error) });
        throw error; // Re-lança o erro para ser tratado pela rota
    }
}
const generateToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ userId, role }, process.env.JWT_SECRET || 'default-secret', {
        expiresIn: '24h',
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
    }
    catch (error) {
        logger_1.default.error('Erro ao verificar token:', { error });
        throw new Error('Token inválido');
    }
};
exports.verifyToken = verifyToken;
const hashPassword = async (password) => {
    const salt = await bcrypt_1.default.genSalt(10);
    return bcrypt_1.default.hash(password, salt);
};
exports.hashPassword = hashPassword;
const comparePasswords = async (password, hashedPassword) => {
    return bcrypt_1.default.compare(password, hashedPassword);
};
exports.comparePasswords = comparePasswords;
async function createUser(userData) {
    try {
        // Verificar se o email já existe
        const existingUser = await User_1.default.findOne({ email: userData.email });
        if (existingUser) {
            throw new Error('Email já cadastrado');
        }
        // Hash da senha
        const hashedPassword = await (0, exports.hashPassword)(userData.password);
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
        const decoded = await (0, exports.verifyToken)(token);
        if (!decoded) {
            return false;
        }
        const user = await User_1.default.findOne({ id: decoded.userId });
        return !!user;
    }
    catch (error) {
        return false;
    }
}
