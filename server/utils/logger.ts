import winston from 'winston';
import 'winston-mongodb'; // Importa a tipagem e o transport para MongoDB
<<<<<<< HEAD
import 'winston-daily-rotate-file';
import path from 'path';
=======
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c

// URI do MongoDB para logging
// Tenta ambas as variáveis de ambiente para maior flexibilidade
const mongoUri = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

// Validação da URI do MongoDB
if (!mongoUri) {
  console.error('!!!!!!!!!! ERRO CRÍTICO: URI do MongoDB não definida para o logger. Verifique as variáveis de ambiente (VITE_MONGODB_URI ou MONGODB_URI) !!!!!!!!!');
  // Em produção, considerar lançar erro para impedir arranque sem logging DB
}

<<<<<<< HEAD
// Configuração de rotação de logs
const logRotationConfig = {
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  zippedArchive: true
};

=======
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c
// Configuração avançada do logger
const logger = winston.createLogger({
  // Nível de log configurável via variável de ambiente
  level: process.env.LOG_LEVEL || 'info',
  
  // Formatação dos logs
  format: winston.format.combine(
    winston.format.timestamp(), // Adiciona timestamp
    winston.format.errors({ stack: true }), // Inclui stack trace completo em erros
    winston.format.json() // Formato JSON para logs estruturados
  ),

  // Transports (destinos dos logs)
  transports: [
<<<<<<< HEAD
    // Rotação de logs de erro
    new winston.transports.DailyRotateFile({
      ...logRotationConfig,
      filename: path.join('logs', 'error-%DATE%.log'),
      level: 'error'
    }),
    
    // Rotação de logs combinados
    new winston.transports.DailyRotateFile({
      ...logRotationConfig,
      filename: path.join('logs', 'combined-%DATE%.log')
    }),
    
    // Rotação de logs de segurança
    new winston.transports.DailyRotateFile({
      ...logRotationConfig,
      filename: path.join('logs', 'security-%DATE%.log'),
      level: 'warn'
    })
=======
    // Transport para arquivo de erros
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    
    // Transport para arquivo combinado
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    
    // Transport para MongoDB (se URI estiver definida)
    ...(mongoUri ? [new winston.transports.MongoDB({
      level: 'warn', // Loga warnings e erros na DB
      db: mongoUri,
      options: { 
        useNewUrlParser: true, 
        useUnifiedTopology: true 
      },
      collection: 'errorLogs', // Coleção para armazenar logs
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.metadata(), // Inclui metadados adicionais
        winston.format.json()
      ),
      metaKey: 'metadata' // Chave para armazenar metadados
    })] : [])
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c
  ],

  // Handlers para exceções não tratadas
  exceptionHandlers: [
<<<<<<< HEAD
    new winston.transports.DailyRotateFile({
      ...logRotationConfig,
      filename: path.join('logs', 'exceptions-%DATE%.log')
=======
    new winston.transports.File({ 
      filename: 'exceptions.log' 
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c
    })
  ],

  // Handlers para rejeições de Promises não tratadas
  rejectionHandlers: [
<<<<<<< HEAD
    new winston.transports.DailyRotateFile({
      ...logRotationConfig,
      filename: path.join('logs', 'rejections-%DATE%.log')
=======
    new winston.transports.File({ 
      filename: 'rejections.log' 
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c
    })
  ]
});

<<<<<<< HEAD
// Adicionar transporte MongoDB apenas em produção e se a URI estiver definida
if (process.env.NODE_ENV === 'production' && mongoUri) {
  logger.add(new winston.transports.MongoDB({
    level: 'warn',
    db: mongoUri,
    options: { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    },
    collection: 'errorLogs',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.metadata(),
      winston.format.json()
    ),
    metaKey: 'metadata'
  }));
} else if (!mongoUri && process.env.NODE_ENV === 'production') {
  logger.warn('MongoDB URI não definida para logging em produção');
}

=======
>>>>>>> 389939c4ac3542d69a04230e4ce71648c27c5f7c
// Configuração adicional para ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    level: 'debug', // Mostra logs de debug no console
    format: winston.format.combine(
      winston.format.colorize(), // Adiciona cores
      winston.format.simple() // Formato simplificado para console
    )
  }));
}

export default logger; 