import winston from 'winston';
import 'winston-mongodb'; // Importa a tipagem e o transport

// URI do MongoDB (garantir que está carregado do .env)
const mongoUri = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI; // Tenta ambas as variáveis
if (!mongoUri) {
  console.error('!!!!!!!!!! ERRO CRÍTICO: URI do MongoDB não definida para o logger. Verifique as variáveis de ambiente (VITE_MONGODB_URI ou MONGODB_URI) !!!!!!!!!');
  // Considerar lançar um erro aqui em produção para impedir o arranque sem logging DB
  // throw new Error('MongoDB URI not configured for logging');
}

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // Nível de log configurável
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }), // Inclui stack trace nos erros
    winston.format.json()
  ),
  transports: [
    // Manter logs em ficheiro
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    
    // Adicionar transport para MongoDB se a URI estiver definida
    ...(mongoUri ? [new winston.transports.MongoDB({
      level: 'warn', // Logar warnings e erros para a DB
      db: mongoUri,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      collection: 'errorLogs', // Nome da coleção
      format: winston.format.combine(
        winston.format.timestamp(), 
        winston.format.metadata(), // Inclui metadados
        winston.format.json()
      ),
      metaKey: 'metadata' // Chave onde os metadados serão guardados
    })] : [])
  ],
  exceptionHandlers: [ // Capturar exceções não tratadas
    new winston.transports.File({ filename: 'exceptions.log' })
    // Poderia adicionar MongoDB aqui também para exceções
  ],
  rejectionHandlers: [ // Capturar rejeições de Promises não tratadas
    new winston.transports.File({ filename: 'rejections.log' })
    // Poderia adicionar MongoDB aqui também para rejeições
  ]
});

// Adicionar console log em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: 'debug', // Mostrar debug na consola em dev
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

export default logger; 