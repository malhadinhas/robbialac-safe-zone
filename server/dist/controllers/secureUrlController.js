"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSecureUploadUrl = exports.generateSecureDownloadUrl = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const logger_1 = __importDefault(require("../utils/logger"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const R2_CONFIG = {
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    region: process.env.R2_REGION || 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
};
const s3 = new client_s3_1.S3Client({
    region: R2_CONFIG.region,
    endpoint: R2_CONFIG.endpoint,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey
    }
});
const generateSecureDownloadUrl = async (req, res) => {
    try {
        const key = req.query.key;
        if (!key) {
            return res.status(400).json({ message: 'Parâmetro "key" é obrigatório.' });
        }
        const command = new client_s3_1.GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        res.json({ url: signedUrl });
    }
    catch (error) {
        logger_1.default.error('Erro ao gerar URL segura de download:', error);
        res.status(500).json({ message: 'Erro ao gerar URL segura.' });
    }
};
exports.generateSecureDownloadUrl = generateSecureDownloadUrl;
const generateSecureUploadUrl = async (req, res) => {
    try {
        const key = req.body.key;
        const contentType = req.body.contentType;
        if (!key || !contentType) {
            return res.status(400).json({ message: 'Parâmetros "key" e "contentType" são obrigatórios.' });
        }
        const command = new client_s3_1.PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
            ContentType: contentType
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, { expiresIn: 3600 });
        res.json({ url: signedUrl });
    }
    catch (error) {
        logger_1.default.error('Erro ao gerar URL segura de upload:', error);
        res.status(500).json({ message: 'Erro ao gerar URL segura.' });
    }
};
exports.generateSecureUploadUrl = generateSecureUploadUrl;
