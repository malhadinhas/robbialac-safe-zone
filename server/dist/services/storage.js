"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFile = exports.uploadFile = exports.deleteFromR2 = exports.getSignedUrl = exports.uploadToR2 = exports.ensureStorageDirectories = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const logger_1 = __importDefault(require("../utils/logger"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const storage_1 = require("../config/storage");
const writeFileAsync = (0, util_1.promisify)(fs_1.default.writeFile);
const unlinkAsync = (0, util_1.promisify)(fs_1.default.unlink);
const mkdirAsync = (0, util_1.promisify)(fs_1.default.mkdir);
// Verificar configurações do R2
if (!storage_1.config.r2.endpoint || !storage_1.config.r2.accessKeyId || !storage_1.config.r2.secretAccessKey || !storage_1.config.r2.bucketName) {
    logger_1.default.error('Configurações do R2 incompletas', {
        hasEndpoint: !!storage_1.config.r2.endpoint,
        hasAccessKey: !!storage_1.config.r2.accessKeyId,
        hasSecretKey: !!storage_1.config.r2.secretAccessKey,
        hasBucket: !!storage_1.config.r2.bucketName
    });
    throw new Error('Configurações do R2 incompletas');
}
// Cliente S3 para Cloudflare R2
const s3Client = new client_s3_1.S3Client({
    region: storage_1.config.r2.region,
    endpoint: storage_1.config.r2.endpoint,
    credentials: {
        accessKeyId: storage_1.config.r2.accessKeyId,
        secretAccessKey: storage_1.config.r2.secretAccessKey
    }
});
logger_1.default.info('Cliente S3 inicializado', {
    endpoint: storage_1.config.r2.endpoint,
    region: storage_1.config.r2.region,
    bucket: storage_1.config.r2.bucketName
});
// Diretório base para armazenamento de arquivos
const BASE_STORAGE_DIR = path_1.default.join(process.cwd(), 'storage');
/**
 * Garante que os diretórios de armazenamento existam
 */
const ensureStorageDirectories = async () => {
    try {
        // Criar diretório base se não existir
        if (!fs_1.default.existsSync(BASE_STORAGE_DIR)) {
            await mkdirAsync(BASE_STORAGE_DIR, { recursive: true });
        }
        // Criar subdiretórios para cada tipo de arquivo
        const subdirs = ['accidents', 'temp', 'profiles'];
        for (const dir of subdirs) {
            const fullPath = path_1.default.join(BASE_STORAGE_DIR, dir);
            if (!fs_1.default.existsSync(fullPath)) {
                await mkdirAsync(fullPath, { recursive: true });
            }
        }
        logger_1.default.info('Diretórios de armazenamento verificados com sucesso');
        return true;
    }
    catch (error) {
        logger_1.default.error('Erro ao criar diretórios de armazenamento', { error });
        throw new Error('Falha ao configurar diretórios de armazenamento');
    }
};
exports.ensureStorageDirectories = ensureStorageDirectories;
/**
 * Faz upload de um arquivo para o R2
 */
const uploadToR2 = async (buffer, key, contentType) => {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: storage_1.config.r2.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType
        });
        await s3Client.send(command);
    }
    catch (error) {
        logger_1.default.error('Erro ao fazer upload para R2', { error, key });
        throw new Error('Falha ao fazer upload do arquivo');
    }
};
exports.uploadToR2 = uploadToR2;
/**
 * Gera uma URL assinada para download do arquivo do R2
 */
const getSignedUrl = async (key) => {
    try {
        // Modo de desenvolvimento - retorna uma URL temporária
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.info('Modo de desenvolvimento - retornando URL temporária', { key });
            return `http://localhost:3000/temp/${key}`;
        }
        logger_1.default.info('Iniciando geração de URL assinada', {
            key,
            bucket: storage_1.config.r2.bucketName,
            endpoint: storage_1.config.r2.endpoint
        });
        const command = new client_s3_1.GetObjectCommand({
            Bucket: storage_1.config.r2.bucketName,
            Key: key
        });
        logger_1.default.info('Configuração do cliente S3', {
            region: storage_1.config.r2.region,
            hasAccessKey: !!storage_1.config.r2.accessKeyId,
            hasSecretKey: !!storage_1.config.r2.secretAccessKey,
            expiresIn: storage_1.config.r2.urlExpiration
        });
        const url = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: storage_1.config.r2.urlExpiration
        });
        logger_1.default.info('URL assinada gerada com sucesso', { url });
        return url;
    }
    catch (error) {
        logger_1.default.error('Erro ao gerar URL assinada', {
            error,
            key,
            errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            errorStack: error instanceof Error ? error.stack : undefined,
            isDev: process.env.NODE_ENV === 'development'
        });
        // Em desenvolvimento, retorna URL temporária mesmo em caso de erro
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.info('Modo de desenvolvimento - retornando URL temporária após erro', { key });
            return `http://localhost:3000/temp/${key}`;
        }
        throw new Error('Falha ao gerar URL de acesso ao arquivo');
    }
};
exports.getSignedUrl = getSignedUrl;
/**
 * Remove um arquivo do R2
 */
const deleteFromR2 = async (key) => {
    try {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: storage_1.config.r2.bucketName,
            Key: key
        });
        await s3Client.send(command);
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir arquivo do R2', { error, key });
        throw new Error('Falha ao excluir arquivo');
    }
};
exports.deleteFromR2 = deleteFromR2;
/**
 * Faz upload de um arquivo para o sistema de arquivos local
 */
const uploadFile = async (buffer, fileName, subdir = 'temp') => {
    try {
        await (0, exports.ensureStorageDirectories)();
        const dirPath = path_1.default.join(BASE_STORAGE_DIR, subdir);
        const filePath = path_1.default.join(dirPath, fileName);
        await writeFileAsync(filePath, buffer);
        // Retorna o caminho relativo ao servidor
        const relativePath = path_1.default.join('/storage', subdir, fileName);
        logger_1.default.info(`Arquivo salvo com sucesso em ${filePath}`);
        return relativePath;
    }
    catch (error) {
        logger_1.default.error('Erro ao fazer upload de arquivo', { error, fileName });
        throw new Error('Falha ao salvar arquivo');
    }
};
exports.uploadFile = uploadFile;
/**
 * Remove um arquivo do sistema de arquivos local
 */
const deleteFile = async (filePath) => {
    try {
        // Verifica se o caminho é relativo ou absoluto
        const fullPath = filePath.startsWith('/storage')
            ? path_1.default.join(process.cwd(), filePath.substring(1))
            : filePath;
        // Verifica se o arquivo existe
        if (!fs_1.default.existsSync(fullPath)) {
            logger_1.default.warn(`Tentativa de excluir arquivo inexistente: ${fullPath}`);
            return false;
        }
        await unlinkAsync(fullPath);
        logger_1.default.info(`Arquivo excluído com sucesso: ${fullPath}`);
        return true;
    }
    catch (error) {
        logger_1.default.error('Erro ao excluir arquivo', { error, filePath });
        throw new Error('Falha ao excluir arquivo');
    }
};
exports.deleteFile = deleteFile;
// Inicializar diretórios ao importar o módulo
(0, exports.ensureStorageDirectories)().catch(error => {
    logger_1.default.error('Falha na inicialização dos diretórios de armazenamento', { error });
});
