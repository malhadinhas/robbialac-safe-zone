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
    signatureVersion: 'v4' // Garantir SigV4
  });
  logger.info('[SecureUrlController] Cliente S3 inicializado com sucesso no backend.');
} catch (error) {
   logger.error('[SecureUrlController] Falha ao inicializar Cliente S3 no backend!', { error });
   // Tratar o erro apropriadamente - talvez impedir o arranque ou retornar erros 500 nos endpoints
}

const getUrlExpiration = (): number => {
  const expiration = Number(process.env.R2_URL_EXPIRATION);
  return !isNaN(expiration) ? expiration : 3600; // Padrão: 1 hora
};

export const generateSecureUrl = async (req: Request, res: Response) => {
  const keyParam = req.query.key as string;

  if (!s3Client) {
    logger.error('Tentativa de gerar URL segura sem cliente S3 inicializado.');
    return res.status(500).json({ message: 'Erro interno do servidor (S3 Client)' });
  }

  if (!keyParam) {
    logger.warn('Pedido para URL segura sem a query param \'key\'.');
    return res.status(400).json({ message: 'Query parameter \'key\' é obrigatório.' });
  }

  logger.info(`[generateSecureUrl] Recebido pedido para chave/URL: ${keyParam}`);

  let objectKey = '';
  try {
    // --- EXTRAIR A CHAVE CORRETA DA URL RECEBIDA ---
    if (keyParam.startsWith('http')) {
      try {
        const url = new URL(keyParam);
        objectKey = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
        logger.info(`[generateSecureUrl] Chave extraída da URL: ${objectKey}`);
      } catch (e) {
        logger.error('[generateSecureUrl] Falha ao parsear URL recebida para extrair chave', { url: keyParam, error: e });
        // Se falhar o parse, talvez a keyParam fosse uma chave malformada?
        objectKey = keyParam; // Tenta usar como está, mas provavelmente falhará
      }
    } else {
      // Se não começa com http, assume que já é a chave
      objectKey = keyParam.startsWith('/') ? keyParam.slice(1) : keyParam;
      logger.info(`[generateSecureUrl] Parâmetro recebido não é URL, usando como chave: ${objectKey}`);
    }
    // --- FIM DA EXTRAÇÃO ---
    
    if (!objectKey) {
       logger.warn('[generateSecureUrl] Chave inválida ou vazia após processamento.', { originalKey: keyParam });
       return res.status(400).json({ message: 'Chave inválida.' });
    }

    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName!,
      Key: objectKey, // Usar a chave extraída e limpa
    });

    logger.info(`[generateSecureUrl] Preparando assinatura para: Bucket=${R2_CONFIG.bucketName}, Key=${objectKey}`);

    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: getUrlExpiration(),
    });

    logger.info(`[generateSecureUrl] URL segura gerada com sucesso para a chave: ${objectKey}`);
    res.json({ signedUrl });

  } catch (error) {
    logger.error('[generateSecureUrl] Erro ao gerar URL segura no backend', {
      receivedParam: keyParam,
      processedKey: objectKey,
      error,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    if (error instanceof Error && error.name === 'NoSuchKey') {
       res.status(404).json({ message: 'Objeto não encontrado no R2.' });
    } else {
       res.status(500).json({ message: 'Erro ao gerar URL segura.' });
    }
  }
}; 