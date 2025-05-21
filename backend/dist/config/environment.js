"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.environment = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Carrega as variáveis de ambiente do arquivo .env
dotenv_1.default.config();
const isProduction = process.env.NODE_ENV === 'production';
exports.environment = {
    // Configurações gerais
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || 3000,
    // URLs
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    API_URL: process.env.API_URL || 'http://localhost:3000',
    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/robbialac-safe-zone',
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
    // AWS S3
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME,
    // Email
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    LOG_FILE_PATH: process.env.LOG_FILE_PATH || path_1.default.join(__dirname, '../../logs'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    // Upload
    MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,video/mp4').split(','),
    // Cache
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '3600'), // 1 hora
};
// Validação das variáveis de ambiente obrigatórias em produção
if (isProduction) {
    const requiredEnvVars = [
        'MONGODB_URI',
        'JWT_SECRET',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_BUCKET_NAME',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS'
    ];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
        throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missingEnvVars.join(', ')}`);
    }
}
