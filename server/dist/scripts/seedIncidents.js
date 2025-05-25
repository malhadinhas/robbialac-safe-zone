"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const Incident_1 = __importDefault(require("../models/Incident"));
const logger_1 = __importDefault(require("../utils/logger"));
const initialIncidents = [
    {
        department: 'Produção',
        description: 'Quase acidente com empilhadeira',
        date: new Date('2024-03-01'),
        status: 'closed',
        severity: 'high'
    },
    {
        department: 'Produção',
        description: 'Derramamento de produto químico',
        date: new Date('2024-03-05'),
        status: 'closed',
        severity: 'medium'
    },
    {
        department: 'Manutenção',
        description: 'Ferramenta solta em altura',
        date: new Date('2024-03-02'),
        status: 'closed',
        severity: 'high'
    },
    {
        department: 'Logística',
        description: 'Carga mal posicionada',
        date: new Date('2024-03-03'),
        status: 'closed',
        severity: 'medium'
    },
    {
        department: 'Qualidade',
        description: 'Reagente armazenado incorretamente',
        date: new Date('2024-03-04'),
        status: 'closed',
        severity: 'low'
    }
];
async function seedIncidents() {
    try {
        await (0, database_1.connectToDatabase)();
        const existingCount = await Incident_1.default.countDocuments();
        if (existingCount > 0) {
            logger_1.default.info(`Já existem ${existingCount} incidentes. Pulando inserção.`);
            return;
        }
        const result = await Incident_1.default.insertMany(initialIncidents);
        logger_1.default.info(`${result.length} incidentes inseridos com sucesso!`);
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Erro ao inserir incidentes', { error });
        process.exit(1);
    }
}
seedIncidents();
