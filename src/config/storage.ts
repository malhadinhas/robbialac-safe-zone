
/**
 * Configuração para armazenamento em Cloudflare R2
 * Estes valores devem ser preenchidos com suas credenciais da Cloudflare R2
 */
export interface CloudflareR2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export interface VideoTranscodingConfig {
  qualities: Array<{
    resolution: string;
    bitrate: string;
  }>;
}

// Configuração padrão para transcodificação de vídeos
export const defaultTranscodingConfig: VideoTranscodingConfig = {
  qualities: [
    {
      resolution: "1280x720",
      bitrate: "2500k"
    },
    {
      resolution: "854x480",
      bitrate: "1000k"
    },
    {
      resolution: "640x360",
      bitrate: "500k"
    }
  ]
};

// Carregamento das configurações do Cloudflare R2 a partir das variáveis de ambiente
// IMPORTANTE: Estas variáveis devem ser definidas em um arquivo .env local em produção
const defaultConfig: CloudflareR2Config = {
  accountId: import.meta.env.VITE_CF_ACCOUNT_ID || '485c3c736434b646ff46725121de873c',
  accessKeyId: import.meta.env.VITE_CF_ACCESS_KEY_ID || '56f3925666837ff8ba99087b930e88cb',
  secretAccessKey: import.meta.env.VITE_CF_SECRET_ACCESS_KEY || '31352a5a4c56a50c5f05cd7cdcb1d010f6fd6a24f32c2b1560bc56a613c266cc',
  bucketName: import.meta.env.VITE_CF_BUCKET_NAME || 'workplace-safety-videos',
  publicUrl: import.meta.env.VITE_CF_PUBLIC_URL || 'https://485c3c736434b646ff46725121de873c.r2.cloudflarestorage.com'
};

// Configuração atual para Cloudflare R2
let r2Config: CloudflareR2Config = { ...defaultConfig };

/**
 * Inicializa a configuração do Cloudflare R2
 */
export function initializeR2Config(config: CloudflareR2Config): void {
  r2Config = config;
  console.log("Configuração R2 inicializada com sucesso");
}

/**
 * Obtém a configuração do Cloudflare R2
 */
export function getR2Config(): CloudflareR2Config {
  return r2Config;
}
