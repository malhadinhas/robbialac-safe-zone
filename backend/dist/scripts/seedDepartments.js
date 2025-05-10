"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const logger_1 = __importDefault(require("../utils/logger"));
const initialDepartments = [
    {
        id: '1',
        name: 'Produção',
        color: '#FF4B4B',
        employeeCount: 40
    },
    {
        id: '2',
        name: 'Manutenção',
        color: '#4CAF50',
        employeeCount: 15
    },
    {
        id: '3',
        name: 'Logística',
        color: '#2196F3',
        employeeCount: 20
    },
    {
        id: '4',
        name: 'Qualidade',
        color: '#9C27B0',
        employeeCount: 10
    },
    {
        id: '5',
        name: 'Segurança',
        color: '#FF9800',
        employeeCount: 8
    }
];
async function seedDepartments() {
    try {
        await (0, database_1.connectToDatabase)();
        const collection = await (0, database_1.getCollection)('departments');
        // Limpa a coleção existente
        await collection.deleteMany({});
        // Insere os departamentos iniciais
        const result = await collection.insertMany(initialDepartments);
        logger_1.default.info('Departamentos inseridos com sucesso', {
            count: result.insertedCount
        });
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Erro ao inserir departamentos', { error });
        process.exit(1);
    }
}
seedDepartments();
