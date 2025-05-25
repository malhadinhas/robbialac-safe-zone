"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const Department_1 = __importDefault(require("../models/Department"));
const logger_1 = __importDefault(require("../utils/logger"));
const initialDepartments = [
    { name: 'Produção', color: '#FF4B4B', employeeCount: 40 },
    { name: 'Manutenção', color: '#4CAF50', employeeCount: 15 },
    { name: 'Logística', color: '#2196F3', employeeCount: 20 },
    { name: 'Qualidade', color: '#9C27B0', employeeCount: 10 },
    { name: 'Segurança', color: '#FF9800', employeeCount: 8 }
];
async function seedDepartments() {
    try {
        await (0, database_1.connectToDatabase)();
        const existingCount = await Department_1.default.countDocuments();
        if (existingCount > 0) {
            logger_1.default.info(`Já existem ${existingCount} departamentos. Pulando inserção.`);
            return;
        }
        const result = await Department_1.default.insertMany(initialDepartments);
        logger_1.default.info(`${result.length} departamentos inseridos com sucesso!`);
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Erro ao inserir departamentos', { error });
        process.exit(1);
    }
}
seedDepartments();
