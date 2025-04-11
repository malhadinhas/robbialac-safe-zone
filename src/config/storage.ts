
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

// Configuração para Cloudflare R2 (a ser preenchida)
let r2Config: CloudflareR2Config | null = null;

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
  if (!r2Config) {
    throw new Error("Configuração R2 não inicializada. Chame initializeR2Config primeiro.");
  }
  return r2Config;
}

