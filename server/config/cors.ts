import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

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
const validateOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  // Permitir origens de desenvolvimento e produção
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://www.robbiseg.pt'
  ];
  // Permitir configuração dinâmica por variável de ambiente
  const envOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
  const allOrigins = [...allowedOrigins, ...envOrigins];
  return allOrigins.includes(origin);
};

// Configuração do CORS
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Permitir requests sem origin (ex: curl, mobile)
    if (validateOrigin(origin)) {
      callback(null, true);
    } else {
      logger.warn('Tentativa de acesso de origem não permitida', { origin });
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
export const corsMiddleware = [cors(corsOptions)];

export default corsMiddleware; 