import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HLSVideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  startAt?: number;
  onProgress?: (progressPercent: number, currentTime: number) => void;
  onEnd?: () => void;
  className?: string;
  thumbnail?: string;
}

export default function HLSVideoPlayer({
  videoUrl,
  autoPlay = false,
  controls = true,
  muted = false,
  startAt = 0,
  onProgress,
  onEnd,
  className = '',
  thumbnail
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Limpar instância anterior do HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    // Verificar se o navegador suporta HLS nativamente
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
    }
    // Se não suporta, usar hls.js
    else if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch(console.error);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error('HLS network error');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error('HLS media error');
              hls.recoverMediaError();
              break;
            default:
              console.error('HLS fatal error');
              setIsError(true);
              break;
          }
        }
      });

      hlsRef.current = hls;
    }

    // Configurar o vídeo
    video.currentTime = startAt;
    video.muted = muted;

    // Adicionar event listeners
    const handleTimeUpdate = () => {
      if (onProgress && video.duration) {
        const progressPercent = (video.currentTime / video.duration) * 100;
        onProgress(progressPercent, video.currentTime);
      }
    };

    const handleEnded = () => {
      onEnd?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [videoUrl, autoPlay, muted, startAt, onProgress, onEnd]);

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <p>Erro ao carregar o vídeo. Por favor, tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      playsInline
      poster={thumbnail}
    />
  );
}

