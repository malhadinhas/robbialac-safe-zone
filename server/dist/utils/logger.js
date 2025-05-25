"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
require("winston-mongodb"); // Importa a tipagem e o transport para MongoDB
require("winston-daily-rotate-file");
const path_1 = __importDefault(require("path"));
// URI do MongoDB para logging
// Tenta ambas as variáveis de ambiente para maior flexibilidade
const mongoUri = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;
// Validação da URI do MongoDB
if (!mongoUri) {
    console.error('!!!!!!!!!! ERRO CRÍTICO: URI do MongoDB não definida para o logger. Verifique as variáveis de ambiente (VITE_MONGODB_URI ou MONGODB_URI) !!!!!!!!!');
    // Em produção, considerar lançar erro para impedir arranque sem logging DB
}
// Configuração de rotação de logs
const logRotationConfig = {
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    zippedArchive: true
};
// Configuração do logger
const logger = winston_1.default.createLogger({
    // Nível de log configurável via variável de ambiente
    level: process.env.LOG_LEVEL || 'info',
    // Formatação dos logs
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), // Adiciona timestamp
    winston_1.default.format.errors({ stack: true }), // Inclui stack trace completo em erros
    winston_1.default.format.json() // Formato JSON para logs estruturados
    ),
    // Transports (destinos dos logs)
    transports: [
        // Logs de erro
        new winston_1.default.transports.DailyRotateFile({
            ...logRotationConfig,
            filename: path_1.default.join('logs', 'error-%DATE%.log'),
            level: 'error'
        }),
        // Logs combinados (apenas em produção)
        ...(process.env.NODE_ENV === 'production' ? [
            new winston_1.default.transports.DailyRotateFile({
                ...logRotationConfig,
                filename: path_1.default.join('logs', 'combined-%DATE%.log')
            })
        ] : []),
        // Logs de segurança
        new winston_1.default.transports.DailyRotateFile({
            ...logRotationConfig,
            filename: path_1.default.join('logs', 'security-%DATE%.log'),
            level: 'warn'
        })
    ],
    // Handlers para exceções não tratadas
    exceptionHandlers: [
        new winston_1.default.transports.DailyRotateFile({
            ...logRotationConfig,
            filename: path_1.default.join('logs', 'exceptions-%DATE%.log')
        })
    ],
    // Handlers para rejeições de Promises não tratadas
    rejectionHandlers: [
        new winston_1.default.transports.DailyRotateFile({
            ...logRotationConfig,
            filename: path_1.default.join('logs', 'rejections-%DATE%.log')
        })
    ]
});
// Adicionar transporte MongoDB apenas em produção e se a URI estiver definida
if (process.env.NODE_ENV === 'production' && mongoUri) {
    logger.add(new winston_1.default.transports.MongoDB({
        level: 'error', // Apenas erros no MongoDB
        db: mongoUri,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        },
        collection: 'errorLogs',
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.metadata(), winston_1.default.format.json()),
        metaKey: 'metadata'
    }));
}
else if (!mongoUri && process.env.NODE_ENV === 'production') {
    logger.warn('MongoDB URI não definida para logging em produção');
}
// Configuração para ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        level: 'info', // Apenas info e acima no console
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), // Adiciona cores
        winston_1.default.format.simple() // Formato simplificado para console
        )
    }));
}
exports.default = logger;
