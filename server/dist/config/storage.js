"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStorageDirectories = exports.storageConfig = exports.config = void 0;
/**
 * @module server/config/storage
 * @description Este módulo centraliza as configurações relacionadas ao armazenamento
 * de arquivos, tanto para o armazenamento em nuvem (Cloudflare R2) quanto
 * para o armazenamento local (uploads, temporários, processados).
 * Define também limites, tipos permitidos e utilitários para manipulação de arquivos.
 */
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
// Import 'dotenv/config' para garantir que as variáveis de ambiente sejam carregadas.
// Se já carregado em outro lugar (ex: database.ts ou server.ts), esta linha
// pode não ser estritamente necessária, mas garante o carregamento neste contexto.
require("dotenv/config");
/**
 * @constant config
 * @description Configurações específicas para o armazenamento em nuvem Cloudflare R2.
 * Carrega credenciais e parâmetros a partir de variáveis de ambiente.
 */
exports.config = {
    r2: {
        /**
         * Endpoint da API do R2. Obtido da variável de ambiente R2_ENDPOINT.
         * Essencial para saber para qual URL enviar as requisições da S3 API compatível.
         * Ex: 'https://<ACCOUNT_ID>.r2.cloudflarestorage.com'
         */
        endpoint: process.env.R2_ENDPOINT,
        /**
         * ID da Chave de Acesso do R2. Obtido da variável de ambiente R2_ACCESS_KEY_ID.
         * Credencial necessária para autenticar as requisições API.
         */
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        /**
         * Chave de Acesso Secreta do R2. Obtido da variável de ambiente R2_SECRET_ACCESS_KEY.
         * Credencial necessária para autenticar as requisições API.
         */
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        /**
         * Nome do Bucket (repositório) no R2 onde os arquivos serão armazenados.
         * Obtido da variável de ambiente R2_BUCKET_NAME.
         */
        bucketName: process.env.R2_BUCKET_NAME,
        /**
         * Região do R2. Obtido da variável de ambiente R2_REGION.
         * O valor 'auto' é geralmente recomendado e funciona bem para o R2.
         */
        region: process.env.R2_REGION || 'auto',
        /**
         * Tempo de expiração (em segundos) para URLs assinadas (presigned URLs) geradas
         * para acesso temporário aos arquivos privados no R2.
         * Obtido de R2_URL_EXPIRATION, com 3600 segundos (1 hora) como valor padrão.
         */
        urlExpiration: parseInt(process.env.R2_URL_EXPIRATION || '3600')
    }
};
/**
 * @constant storageConfig
 * @description Configurações gerais para o armazenamento de arquivos localmente no servidor
 * e definições para validações de uploads e processamento de vídeos.
 */
exports.storageConfig = {
    /**
     * Diretório base onde os arquivos finais (não temporários) serão armazenados localmente.
     * Define o caminho absoluto combinando o diretório de trabalho atual com '/uploads'.
     */
    uploadDir: path_1.default.join(process.cwd(), 'uploads'),
    /**
     * Diretório para armazenar arquivos temporariamente durante o processo de upload ou processamento.
     * Define o caminho absoluto combinando o diretório de trabalho atual com '/temp'.
     */
    tempDir: path_1.default.join(process.cwd(), 'temp'),
    /**
     * Diretório específico para armazenar as miniaturas (thumbnails) geradas dos vídeos.
     * Localizado dentro do diretório principal de uploads.
     */
    thumbnailDir: path_1.default.join(process.cwd(), 'uploads', 'thumbnails'),
    /**
     * Diretório específico para armazenar os vídeos após o processamento/transcodificação.
     * Localizado dentro do diretório principal de uploads.
     */
    processedDir: path_1.default.join(process.cwd(), 'uploads', 'processed'),
    /**
     * Tamanho máximo permitido para upload de arquivo, definido em bytes.
     * Configurado para 10 Gigabytes (10 * 1024 * 1024 * 1024 bytes).
     */
    maxFileSize: 10 * 1024 * 1024 * 1024,
    /**
     * Duração máxima permitida para vídeos, definida em segundos.
     * Configurado para 14400 segundos (equivalente a 4 horas).
     */
    maxDuration: 14400,
    /**
     * Lista de tipos MIME (Multipurpose Internet Mail Extensions) permitidos para upload de vídeos.
     * Usado para validar o tipo do arquivo no lado do servidor de forma mais robusta.
     */
    allowedMimeTypes: [
        'video/mp4', // .mp4
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/x-matroska' // .mkv
    ],
    /**
     * Lista de extensões de arquivo permitidas.
     * Pode ser usado como uma validação adicional ou alternativa aos tipos MIME.
     */
    allowedExtensions: ['.mp4', '.mov', '.avi', '.mkv'],
    /**
     * @function generateFileName
     * @description Gera um nome de arquivo único e aleatório, preservando a extensão original.
     * Utiliza um UUID (Universally Unique Identifier) da biblioteca 'crypto' do Node.js
     * para garantir a unicidade e evitar colisões de nomes de arquivos.
     * @param {string} originalname - O nome original do arquivo enviado pelo cliente.
     * @returns {string} Um novo nome de arquivo único com a extensão original em minúsculas.
     */
    generateFileName: (originalname) => {
        // Extrai a extensão do arquivo original (ex: '.mp4') e converte para minúsculas.
        const ext = path_1.default.extname(originalname).toLowerCase();
        // Gera um UUID v4 aleatório (ex: 'f47ac10b-58cc-4372-a567-0e02b2c3d479').
        const uniqueId = (0, crypto_1.randomUUID)();
        // Concatena o UUID com a extensão para formar o novo nome.
        return `${uniqueId}${ext}`;
    },
    /**
     * Define as configurações para diferentes qualidades alvo durante a transcodificação de vídeo.
     * Cada chave (ex: 'high', 'medium', 'low') representa um perfil de qualidade.
     * Para cada perfil, especifica-se a resolução (largura, altura) e o bitrate (taxa de bits) alvo.
     * Estes valores são tipicamente usados por ferramentas como FFmpeg para gerar múltiplas
     * versões do vídeo otimizadas para streaming adaptativo (HLS).
     */
    videoQualities: {
        high: { width: 1920, height: 1080, bitrate: '4000k' }, // Qualidade Full HD (1080p)
        medium: { width: 1280, height: 720, bitrate: '2000k' }, // Qualidade HD (720p)
        low: { width: 854, height: 480, bitrate: '1000k' } // Qualidade SD (480p)
    }
};
/**
 * @function ensureStorageDirectories
 * @description Função assíncrona que verifica se os diretórios de armazenamento locais
 * definidos em `storageConfig` existem no sistema de arquivos. Se um diretório não
 * existir, ele será criado recursivamente.
 * É essencial chamar esta função na inicialização do servidor para garantir que
 * a aplicação possa salvar arquivos nos locais esperados sem erros.
 * @returns {Promise<void>} Uma Promise que resolve quando todos os diretórios foram verificados/criados.
 */
const ensureStorageDirectories = async () => {
    // Importa dinamicamente o módulo 'fs/promises' para operações de sistema de arquivos assíncronas.
    const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
    // Cria uma lista com os caminhos dos diretórios a serem verificados.
    const directories = [
        exports.storageConfig.uploadDir,
        exports.storageConfig.tempDir,
        exports.storageConfig.thumbnailDir,
        exports.storageConfig.processedDir
    ];
    // Itera sobre cada diretório na lista.
    for (const dir of directories) {
        try {
            // Tenta acessar o diretório. Se bem-sucedido, o diretório existe.
            await fs.access(dir);
        }
        catch {
            // Se fs.access() lançar um erro (geralmente porque o diretório não existe),
            // cria o diretório usando fs.mkdir.
            // A opção { recursive: true } garante que diretórios pais também sejam criados se necessário.
            // Ex: Se '/uploads' não existe, ele criará '/uploads' e depois '/uploads/thumbnails'.
            await fs.mkdir(dir, { recursive: true });
        }
    }
};
exports.ensureStorageDirectories = ensureStorageDirectories;
