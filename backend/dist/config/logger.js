"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = void 0;
const winston_1 = __importDefault(require("winston"));
require("winston-daily-rotate-file");
const environment_1 = require("./environment");
const path_1 = __importDefault(require("path"));
// Formato personalizado para os logs
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
// Configuração dos transportes de log
const consoleTransports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }),
];
const fileTransports = environment_1.environment.NODE_ENV === 'production' ? [
    new winston_1.default.transports.DailyRotateFile({
        filename: path_1.default.join(environment_1.environment.LOG_FILE_PATH, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxFiles: '30d',
        maxSize: '20m',
    }),
    new winston_1.default.transports.DailyRotateFile({
        filename: path_1.default.join(environment_1.environment.LOG_FILE_PATH, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '30d',
        maxSize: '20m',
    })
] : [];
// Cria o logger
const logger = winston_1.default.createLogger({
    level: environment_1.environment.LOG_LEVEL,
    format: logFormat,
    transports: [...consoleTransports, ...fileTransports],
    // Não sai do processo em caso de erro
    exitOnError: false,
});
// Adiciona um stream para o Morgan
exports.stream = {
    write: (message) => {
        logger.info(message.trim());
    },
};
exports.default = logger;
