import { Request, Response } from 'express';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const R2_CONFIG = {
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
};

const s3 = new S3Client({
  region: R2_CONFIG.region,
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId!,
    secretAccessKey: R2_CONFIG.secretAccessKey!
  }
});

export const generateSecureDownloadUrl = async (req: Request, res: Response) => {
  try {
    const key = req.query.key as string;

    if (!key) {
      return res.status(400).json({ message: 'Parâmetro "key" é obrigatório.' });
    }

    const command = new GetObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url: signedUrl });
  } catch (error) {
    logger.error('Erro ao gerar URL segura de download:', error);
    res.status(500).json({ message: 'Erro ao gerar URL segura.' });
  }
};

export const generateSecureUploadUrl = async (req: Request, res: Response) => {
  try {
    const key = req.body.key as string;
    const contentType = req.body.contentType as string;

    if (!key || !contentType) {
      return res.status(400).json({ message: 'Parâmetros "key" e "contentType" são obrigatórios.' });
    }

    const command = new PutObjectCommand({
      Bucket: R2_CONFIG.bucketName,
      Key: key,
      ContentType: contentType
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url: signedUrl });
  } catch (error) {
    logger.error('Erro ao gerar URL segura de upload:', error);
    res.status(500).json({ message: 'Erro ao gerar URL segura.' });
  }
};
