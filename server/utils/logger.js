"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = require("winston");

// Configuração principal do logger usando Winston
// - level: define o nível mínimo de log (info)
// - format: combina timestamp com formato JSON para logs estruturados
// - transports: define onde os logs serão armazenados
var logger = winston_1.default.createLogger({
    level: 'info', // Nível mínimo de log
    format: winston_1.default.format.combine(
        winston_1.default.format.timestamp(), // Adiciona timestamp a cada log
        winston_1.default.format.json() // Formata logs como JSON
    ),
    transports: [
        // Transport para arquivo de erros (apenas logs de nível error)
        new winston_1.default.transports.File({ 
            filename: 'error.log', 
            level: 'error' 
        }),
        // Transport para arquivo combinado (todos os níveis de log)
        new winston_1.default.transports.File({ 
            filename: 'combined.log' 
        })
    ]
});

// Adiciona transporte para console em ambiente de desenvolvimento
// - Aplica formatação colorida para melhor visualização
// - Usa formato simples para logs no console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(
            winston_1.default.format.colorize(), // Adiciona cores aos logs
            winston_1.default.format.simple() // Formato simplificado para console
        )
    }));
}

exports.default = logger;
