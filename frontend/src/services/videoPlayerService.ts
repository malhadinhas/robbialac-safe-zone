import Hls from 'hls.js';

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
 */
export function loadHlsPlayer(videoElement: HTMLVideoElement, hlsUrl: string, options: PlayerOptions = {}): () => void {
  let hls: Hls | null = null;
  
  // Configurar opções do vídeo
  if (options.autoplay) {
    videoElement.autoplay = true;
  }
  
  if (options.muted) {
    videoElement.muted = true;
  }
  
  if (options.controls) {
    videoElement.controls = true;
  }
  
  // Se o navegador suporta HLS nativamente
  if (isHlsSupported()) {
    videoElement.src = hlsUrl;
    
    if (options.startTime) {
      videoElement.currentTime = options.startTime;
    }
  }
  // Se o navegador não suporta HLS nativamente, usar hls.js
  else if (Hls.isSupported()) {
    hls = new Hls({
      debug: false,
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 90
    });
    
    hls.loadSource(hlsUrl);
    hls.attachMedia(videoElement);
    
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      if (options.startTime) {
        videoElement.currentTime = options.startTime;
      }
      if (options.autoplay) {
        videoElement.play().catch(() => {});
      }
    });
    
    hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls?.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls?.recoverMediaError();
            break;
          default:
            destroyPlayer();
            break;
        }
      }
    });
  } else {
    throw new Error('Seu navegador não suporta reprodução de vídeos HLS');
  }
  
  // Função para destruir o player
  const destroyPlayer = () => {
    videoElement.pause();
    videoElement.src = '';
    videoElement.load();
    
    if (hls) {
      hls.destroy();
      hls = null;
    }
  };
  
  return destroyPlayer;
}

/**
 * Hook para usar o player HLS em um componente React
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

