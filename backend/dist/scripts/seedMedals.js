"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../services/database");
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = require("crypto");
const medals = [
    {
        id: (0, crypto_1.randomUUID)(),
        name: 'Segurança em Foco',
        description: 'Concedida a colaboradores que completaram todos os módulos de segurança.',
        imageSrc: '/images/medals/safety_focus.png',
        category: 'Segurança'
    },
    {
        id: (0, crypto_1.randomUUID)(),
        name: 'Mestre da Qualidade',
        description: 'Reconhecimento por excelência em práticas de qualidade.',
        imageSrc: '/images/medals/quality_master.png',
        category: 'Qualidade'
    },
    {
        id: (0, crypto_1.randomUUID)(),
        name: 'Guardião de Regras',
        description: 'Atribuída a quem demonstra conhecimento excepcional de procedimentos.',
        imageSrc: '/images/medals/rules_guardian.png',
        category: 'Procedimentos e Regras'
    },
    {
        id: (0, crypto_1.randomUUID)(),
        name: 'Prevenção Total',
        description: 'Reconhecimento por contribuir ativamente para a prevenção de acidentes.',
        imageSrc: '/images/medals/prevention.png',
        category: 'Segurança'
    },
    {
        id: (0, crypto_1.randomUUID)(),
        name: 'Inovador',
        description: 'Premiação por sugestões inovadoras que melhoram a segurança ou eficiência.',
        imageSrc: '/images/medals/innovator.png',
        category: 'Inovação'
    }
];
async function seedMedals() {
    try {
        logger_1.default.info('Iniciando população de medalhas...');
        // Conectar ao banco de dados
        await (0, database_1.connectToDatabase)();
        // Obter a coleção
        const collection = await (0, database_1.getCollection)('medals');
        // Verificar se já existem medalhas
        const existingCount = await collection.countDocuments();
        if (existingCount > 0) {
            logger_1.default.info(`Já existem ${existingCount} medalhas. Pulando inserção.`);
            return;
        }
        // Inserir medalhas
        const result = await collection.insertMany(medals);
        logger_1.default.info(`${result.insertedCount} medalhas inseridas com sucesso!`);
    }
    catch (error) {
        logger_1.default.error('Erro ao popular medalhas:', { error });
    }
}
// Executar o script
seedMedals().then(() => {
    logger_1.default.info('Script finalizado.');
    process.exit(0);
}).catch(error => {
    logger_1.default.error('Erro ao executar script:', { error });
    process.exit(1);
});
