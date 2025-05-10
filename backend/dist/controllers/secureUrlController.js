"use strict";
/**
 * @module server/controllers/secureUrlController
 * @description Controlador responsável por gerar URLs seguras para acesso a ficheiros
 * armazenados no Cloudflare R2. Utiliza o SDK AWS para gerar URLs assinadas temporárias.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureUrl = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = __importDefault(require("../utils/logger"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Carregar variáveis de ambiente do .env
/**
 * @const R2_CONFIG
 * @description Configuração do cliente R2 baseada em variáveis de ambiente.
 * Inclui credenciais e configurações do bucket.
 */
const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
};
// --- LOG ADICIONAL ANTES DE CRIAR O CLIENTE ---
logger_1.default.info('[SecureUrlController] Verificando process.env ANTES de criar S3Client:', {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? 'Definido' : 'NÃO DEFINIDO',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 4)}...` : 'NÃO DEFINIDO',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'Definido' : 'NÃO DEFINIDO',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? 'Definido' : 'NÃO DEFINIDO',
    R2_REGION: process.env.R2_REGION || 'auto (padrão)',
    R2_ENDPOINT_ENV: process.env.R2_ENDPOINT, // Logar se R2_ENDPOINT está definida
    R2_CONFIG_CalculatedEndpoint: R2_CONFIG.endpoint // Logar endpoint calculado
});
// --- FIM DO LOG ADICIONAL ---
// Validação inicial das configurações
if (!R2_CONFIG.accountId || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey || !R2_CONFIG.bucketName) {
    logger_1.default.error('[SecureUrlController] Configuração R2 incompleta no backend! Verifique as variáveis R2_* no .env');
    // Considerar lançar um erro ou ter um estado de erro interno
}
/**
 * Inicialização do cliente S3
 * @description Configura e inicializa o cliente S3 com as credenciais R2
 * e configurações de conexão otimizadas.
 */
let s3Client;
try {
    s3Client = new client_s3_1.S3Client({
        region: R2_CONFIG.region,
        endpoint: R2_CONFIG.endpoint,
        credentials: {
            accessKeyId: R2_CONFIG.accessKeyId,
            secretAccessKey: R2_CONFIG.secretAccessKey
        },
        signatureVersion: 'v4', // Garantir SigV4
        tls: true,
        forcePathStyle: true, // Forçar URL com estilo de caminho (pode ajudar com alguns endpoints)
        requestHandler: {
            connectionTimeout: 5000, // 5 segundos para timeout de conexão
        },
        // Configurações adicionais para resolver problemas SSL
        maxAttempts: 3,
        customUserAgent: 'RobbialacSafeZone/1.0',
        retryMode: 'standard',
        followRegionRedirects: true
    });
    logger_1.default.info('[SecureUrlController] Cliente S3 inicializado com sucesso no backend.');
}
catch (error) {
    logger_1.default.error('[SecureUrlController] Falha ao inicializar Cliente S3 no backend!', { error });
    // Tratar o erro apropriadamente - talvez impedir o arranque ou retornar erros 500 nos endpoints
}
/**
 * @function getUrlExpiration
 * @description Obtém o tempo de expiração para URLs assinadas
 * @param {Request} req - Requisição Express
 * @returns {number} Tempo de expiração em segundos (padrão: 3600)
 */
const getUrlExpiration = (req) => {
    const expiration = Number(process.env.R2_URL_EXPIRATION);
    return !isNaN(expiration) ? expiration : 3600; // Padrão: 1 hora
};
/**
 * @function generateSecureUrl
 * @description Gera uma URL assinada temporária para acesso a um objeto no R2
 * @param {Request} req - Requisição Express (espera query params 'url' ou 'key')
 * @param {Response} res - Resposta Express
 * @returns {Promise<void>} Responde com a URL assinada ou erro
 */
const generateSecureUrl = async (req, res) => {
    try {
        // Verificações iniciais
        if (!s3Client) {
            return res.status(500).json({ error: 'Erro interno do servidor: Cliente S3 não inicializado' });
        }
        // Extração da chave do objeto
        const urlKey = req.query.url;
        const keyParam = req.query.key;
        // Validações e processamento
        if (!urlKey && !keyParam) {
            logger_1.default.error('[SecureUrlController] Requisição sem url ou key');
            return res.status(400).json({ error: 'URL ou key do objeto é necessária' });
        }
        // Obtém a chave do objeto
        let objectKey = '';
        if (urlKey) {
            const url = new URL(urlKey);
            objectKey = url.pathname.substring(1); // Remove a barra inicial
        }
        else {
            objectKey = keyParam;
        }
        logger_1.default.info(`[SecureUrlController] Gerando URL assinada para objeto: ${objectKey}`);
        // Log da configuração (omitindo dados sensíveis)
        logger_1.default.info(`[SecureUrlController] Configuração R2: 
      região: ${R2_CONFIG.region}, 
      endpoint: ${R2_CONFIG.endpoint}, 
      bucket: ${R2_CONFIG.bucketName},
      ID de acesso disponível: ${!!R2_CONFIG.accessKeyId},
      Chave secreta disponível: ${!!R2_CONFIG.secretAccessKey}`);
        // Geração da URL assinada
        const command = new client_s3_1.GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: objectKey
        });
        // Obtém o tempo de expiração
        const expiresIn = getUrlExpiration(req);
        logger_1.default.info(`[SecureUrlController] Tempo de expiração definido: ${expiresIn} segundos`);
        // Gera a URL assinada
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn });
        // Log completo da URL assinada para depuração
        logger_1.default.info(`[SecureUrlController] URL assinada gerada: ${signedUrl}`);
        // Analisar a URL assinada para depuração
        try {
            const parsedUrl = new URL(signedUrl);
            logger_1.default.info(`[SecureUrlController] URL assinada - Protocolo: ${parsedUrl.protocol}, Host: ${parsedUrl.host}, Caminho: ${parsedUrl.pathname}`);
            logger_1.default.info(`[SecureUrlController] Parâmetros da URL assinada: ${parsedUrl.search}`);
        }
        catch (parseError) {
            logger_1.default.error(`[SecureUrlController] Erro ao analisar URL assinada: ${parseError}`);
        }
        // Mantemos o formato "signedUrl" para compatibilidade com o cliente
        return res.json({ signedUrl });
    }
    catch (error) {
        // Tratamento de erros
        logger_1.default.error('[SecureUrlController] Erro ao gerar URL segura', {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            objectKey: urlKey || keyParam,
            bucketName: R2_CONFIG.bucketName
        });
        return res.status(500).json({ message: 'Falha ao gerar URL segura.' });
    }
};
exports.generateSecureUrl = generateSecureUrl;
