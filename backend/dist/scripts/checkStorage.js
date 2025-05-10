"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkStorage = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const storage_1 = require("../config/storage");
const logger_1 = __importDefault(require("../utils/logger"));
async function checkDirectory(directory, name) {
    try {
        await fs_1.promises.access(directory);
        const stats = await fs_1.promises.stat(directory);
        if (!stats.isDirectory()) {
            logger_1.default.error(`${name} não é um diretório`, { path: directory });
            return false;
        }
        logger_1.default.info(`${name} verificado com sucesso`, { path: directory });
        return true;
    }
    catch (error) {
        logger_1.default.error(`Erro ao verificar ${name}`, {
            path: directory,
            error
        });
        return false;
    }
}
async function checkPermissions(directory, name) {
    try {
        // Tentar criar um arquivo temporário para verificar permissões
        const testFile = path_1.default.join(directory, `.test_${Date.now()}`);
        await fs_1.promises.writeFile(testFile, 'test');
        await fs_1.promises.unlink(testFile);
        logger_1.default.info(`Permissões de ${name} verificadas com sucesso`, { path: directory });
        return true;
    }
    catch (error) {
        logger_1.default.error(`Erro nas permissões de ${name}`, {
            path: directory,
            error
        });
        return false;
    }
}
async function main() {
    logger_1.default.info('Iniciando verificação de armazenamento');
    const directories = [
        { path: storage_1.storageConfig.uploadDir, name: 'Diretório de uploads' },
        { path: storage_1.storageConfig.tempDir, name: 'Diretório temporário' },
        { path: storage_1.storageConfig.thumbnailDir, name: 'Diretório de thumbnails' },
        { path: storage_1.storageConfig.processedDir, name: 'Diretório de vídeos processados' }
    ];
    let allOk = true;
    for (const dir of directories) {
        const exists = await checkDirectory(dir.path, dir.name);
        if (!exists) {
            try {
                await fs_1.promises.mkdir(dir.path, { recursive: true });
                logger_1.default.info(`${dir.name} criado com sucesso`, { path: dir.path });
            }
            catch (error) {
                logger_1.default.error(`Erro ao criar ${dir.name}`, {
                    path: dir.path,
                    error
                });
                allOk = false;
                continue;
            }
        }
        const hasPermissions = await checkPermissions(dir.path, dir.name);
        if (!hasPermissions) {
            allOk = false;
        }
    }
    if (allOk) {
        logger_1.default.info('Verificação de armazenamento concluída com sucesso');
    }
    else {
        logger_1.default.error('Verificação de armazenamento encontrou problemas');
    }
}
exports.checkStorage = main;
