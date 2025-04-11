
/**
 * Serviço para gerenciamento do player de vídeo HLS
 * Utiliza a biblioteca hls.js para reprodução de vídeos HLS
 */

export type PlayerOptions = {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  startTime?: number;
};

/**
 * Verifica se o navegador suporta HLS nativamente
 */
export function isHlsSupported(): boolean {
  const video = document.createElement('video');
  return Boolean(
    video.canPlayType('application/vnd.apple.mpegurl') ||
    video.canPlayType('application/x-mpegURL')
  );
}

/**
 * Carrega um player HLS no elemento de vídeo fornecido.
 * Este é um wrapper que em produção usaria hls.js
 */
export function loadHlsPlayer(videoElement: HTMLVideoElement, hlsUrl: string, options: PlayerOptions = {}): () => void {
  console.log(`Carregando vídeo HLS: ${hlsUrl}`);
  
  // Em produção, aqui verificaríamos suporte a HLS e carregaríamos hls.js se necessário
  videoElement.src = hlsUrl;
  
  if (options.autoplay) {
    videoElement.autoplay = true;
  }
  
  if (options.muted) {
    videoElement.muted = true;
  }
  
  if (options.controls) {
    videoElement.controls = true;
  }
  
  if (options.startTime) {
    videoElement.currentTime = options.startTime;
  }
  
  // Função para destruir o player
  return () => {
    videoElement.pause();
    videoElement.src = '';
    videoElement.load();
    console.log('Player HLS destruído');
  };
}

/**
 * Hook para usar o player HLS em um componente React
 * Em produção, isso seria implementado como um hook React real
 */
export function setupHlsPlayer(): {
  attachPlayer: (element: HTMLVideoElement, url: string, options?: PlayerOptions) => void;
  destroyPlayer: () => void;
} {
  let destroyFn: (() => void) | null = null;
  
  const attachPlayer = (element: HTMLVideoElement, url: string, options?: PlayerOptions) => {
    if (destroyFn) {
      destroyFn();
    }
    
    destroyFn = loadHlsPlayer(element, url, options);
  };
  
  const destroyPlayer = () => {
    if (destroyFn) {
      destroyFn();
      destroyFn = null;
    }
  };
  
  return {
    attachPlayer,
    destroyPlayer
  };
}

