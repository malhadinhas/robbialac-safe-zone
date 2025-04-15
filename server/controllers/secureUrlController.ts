import { Request, Response } from 'express';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config(); // Carregar variáveis de ambiente do .env

// Configurações do R2 (lidas do .env do servidor)
const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
};

// --- LOG ADICIONAL ANTES DE CRIAR O CLIENTE ---
logger.info('[SecureUrlController] Verificando process.env ANTES de criar S3Client:', {
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
  logger.error('[SecureUrlController] Configuração R2 incompleta no backend! Verifique as variáveis R2_* no .env');
  // Considerar lançar um erro ou ter um estado de erro interno
}

let s3Client: S3Client;
try {
  s3Client = new S3Client({
    region: R2_CONFIG.region,
    endpoint: R2_CONFIG.endpoint,
    credentials: {
      accessKeyId: R2_CONFIG.accessKeyId!,
      secretAccessKey: R2_CONFIG.secretAccessKey!
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
  logger.info('[SecureUrlController] Cliente S3 inicializado com sucesso no backend.');
} catch (error) {
   logger.error('[SecureUrlController] Falha ao inicializar Cliente S3 no backend!', { error });
   // Tratar o erro apropriadamente - talvez impedir o arranque ou retornar erros 500 nos endpoints
}

const getUrlExpiration = (req: Request): number => {
  const expiration = Number(process.env.R2_URL_EXPIRATION);
  return !isNaN(expiration) ? expiration : 3600; // Padrão: 1 hora
};

export const generateSecureUrl = async (req: Request, res: Response) => {
  try {
    if (!s3Client) {
      logger.error('[SecureUrlController] Cliente S3 não inicializado corretamente.');
      return res.status(500).json({ error: 'Erro interno do servidor: Cliente S3 não inicializado' });
    }

    // Extrai a key da URL ou dos parâmetros da consulta
    const urlKey = req.query.url as string;
    const keyParam = req.query.key as string;
    
    if (!urlKey && !keyParam) {
      logger.error('[SecureUrlController] Requisição sem url ou key');
      return res.status(400).json({ error: 'URL ou key do objeto é necessária' });
    }

    // Obtém a chave do objeto
    let objectKey = '';
    
    if (urlKey) {
      const url = new URL(urlKey);
      objectKey = url.pathname.substring(1); // Remove a barra inicial
    } else {
      objectKey = keyParam;
    }
    
    logger.info(`[SecureUrlController] Gerando URL assinada para objeto: ${objectKey}`);
    
    // Log da configuração (omitindo dados sensíveis)
    logger.info(`[SecureUrlController] Configuração R2: 
      região: ${R2_CONFIG.region}, 
      endpoint: ${R2_CONFIG.endpoint}, 
      bucket: ${R2_CONFIG.bucketName},
      ID de acesso disponível: ${!!R2_CONFIG.accessKeyId},
      Chave secreta disponível: ${!!R2_CONFIG.secretAccessKey}`
    );

    // Cria o comando para obter o objeto
    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName!,
      Key: objectKey
    });

    // Obtém o tempo de expiração
    const expiresIn = getUrlExpiration(req);
    
    logger.info(`[SecureUrlController] Tempo de expiração definido: ${expiresIn} segundos`);

    // Gera a URL assinada
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    
    // Log completo da URL assinada para depuração
    logger.info(`[SecureUrlController] URL assinada gerada: ${signedUrl}`);
    
    // Analisar a URL assinada para depuração
    try {
      const parsedUrl = new URL(signedUrl);
      logger.info(`[SecureUrlController] URL assinada - Protocolo: ${parsedUrl.protocol}, Host: ${parsedUrl.host}, Caminho: ${parsedUrl.pathname}`);
      logger.info(`[SecureUrlController] Parâmetros da URL assinada: ${parsedUrl.search}`);
    } catch (parseError) {
      logger.error(`[SecureUrlController] Erro ao analisar URL assinada: ${parseError}`);
    }

    // Mantemos o formato "signedUrl" para compatibilidade com o cliente
    return res.json({ signedUrl });
  } catch (error) {
    logger.error('[SecureUrlController] Erro ao gerar URL segura', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      objectKey: urlKey || keyParam,
      bucketName: R2_CONFIG.bucketName
    });
    
    return res.status(500).json({ message: 'Falha ao gerar URL segura.' });
  }
}; 