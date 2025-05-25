"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("../utils/logger"));
// Lista de headers permitidos (inclui todos os headers padrão do browser)
const ALLOWED_HEADERS = [
    'Content-Type',
    'Authorization',
    'Range',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
    'Referer',
    'User-Agent',
    'Accept-Encoding',
    'Accept-Language',
    'Sec-Fetch-Site',
    'Sec-Fetch-Mode',
    'Sec-Fetch-Dest',
    'Sec-Ch-Ua',
    'Sec-Ch-Ua-Mobile',
    'Sec-Ch-Ua-Platform',
    'Host',
    'Connection',
    'Content-Length'
];
// Lista de headers expostos
const EXPOSED_HEADERS = [
    'Content-Range',
    'X-Content-Range',
    'Content-Length',
    'Content-Type',
    'Authorization'
];
// Métodos HTTP permitidos
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'];
// Função para validar a origem da requisição
const validateOrigin = (origin) => {
    if (!origin)
        return false;
    // Permitir origens de desenvolvimento e produção
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://www.robbiseg.pt',
        'https://staging-api.learnsafe360.pt', // Staging backend
        'https://learnsafe360.netlify.app', // Netlify frontend produção
        'https://staging-learnsafe360.netlify.app' // Netlify frontend staging
    ];
    // Permitir configuração dinâmica por variável de ambiente
    const envOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
    const allOrigins = [...allowedOrigins, ...envOrigins];
    return allOrigins.includes(origin);
};
// Configuração do CORS
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true); // Permitir requests sem origin (ex: curl, mobile)
        if (validateOrigin(origin)) {
            callback(null, true);
        }
        else {
            logger_1.default.warn('Tentativa de acesso de origem não permitida', { origin });
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    methods: ALLOWED_METHODS,
    allowedHeaders: ALLOWED_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    credentials: true,
    maxAge: 86400 // 24 horas
};
// Middleware CORS configurado
exports.corsMiddleware = [(0, cors_1.default)(corsOptions)];
exports.default = exports.corsMiddleware;
