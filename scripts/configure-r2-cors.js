/**
 * Script para configurar CORS no bucket Cloudflare R2
 * 
 * Uso: node scripts/configure-r2-cors.js
 */

require('dotenv').config();
const { S3Client, PutBucketCorsCommand } = require('@aws-sdk/client-s3');

// Obter configurações do R2 do .env
const R2_CONFIG = {
  endpoint: process.env.R2_ENDPOINT,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME,
  region: 'auto'
};

// Verificar se as configurações estão presentes
if (!R2_CONFIG.endpoint || !R2_CONFIG.accessKeyId || !R2_CONFIG.secretAccessKey || !R2_CONFIG.bucketName) {
  console.error('Erro: Configurações R2 incompletas. Verifique seu arquivo .env');
  process.exit(1);
}

// Configurar origens CORS permitidas
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',');
console.log('Origens CORS permitidas:', allowedOrigins);

// Criar cliente S3
const s3Client = new S3Client({
  region: R2_CONFIG.region,
  endpoint: R2_CONFIG.endpoint,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey
  }
});

// Configuração CORS para o bucket
const corsConfig = {
  Bucket: R2_CONFIG.bucketName,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedHeaders: ['*'],
        AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        AllowedOrigins: allowedOrigins,
        ExposeHeaders: ['ETag', 'Content-Length', 'x-amz-meta-custom-header'],
        MaxAgeSeconds: 3600
      }
    ]
  }
};

async function configureCors() {
  try {
    console.log('Aplicando configuração CORS ao bucket', R2_CONFIG.bucketName);
    const command = new PutBucketCorsCommand(corsConfig);
    const response = await s3Client.send(command);
    console.log('Configuração CORS aplicada com sucesso!');
    console.log('Detalhes:', response);
  } catch (error) {
    console.error('Erro ao configurar CORS:', error);
    process.exit(1);
  }
}

configureCors(); 