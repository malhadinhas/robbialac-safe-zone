import winston from 'winston';
import 'winston-mongodb'; // Importa a tipagem e o transport para MongoDB

// URI do MongoDB para logging
// Tenta ambas as variáveis de ambiente para maior flexibilidade
const mongoUri = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

// Validação da URI do MongoDB
if (!mongoUri) {
  console.error('!!!!!!!!!! ERRO CRÍTICO: URI do MongoDB não definida para o logger. Verifique as variáveis de ambiente (VITE_MONGODB_URI ou MONGODB_URI) !!!!!!!!!');
  // Em produção, considerar lançar erro para impedir arranque sem logging DB
}

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
  ],

  // Handlers para exceções não tratadas
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'exceptions.log' 
    })
  ],

  // Handlers para rejeições de Promises não tratadas
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'rejections.log' 
    })
  ]
});

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