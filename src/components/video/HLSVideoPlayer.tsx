import { useEffect, useRef, useState } from 'react';
// import Hls from 'hls.js'; // Não é mais necessário para MP4

interface VideoPlayerProps { // Renomeado de HLSVideoPlayerProps
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  startAt?: number;
  onProgress?: (progressPercent: number, currentTime: number) => void;
  onEnd?: () => void;
  className?: string;
  thumbnail?: string; // Poster image
}

// Renomeado de HLSVideoPlayer
export default function VideoPlayer({
  videoUrl,
  autoPlay = false,
  controls = true,
  muted = false,
  startAt = 0,
  onProgress,
  onEnd,
  className = '',
  thumbnail
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  // const hlsRef = useRef<Hls | null>(null); // Não é mais necessário
  const [isError, setIsError] = useState(false); // Manter para erros de <video>

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // --- Lógica do HLS removida ---
    // if (hlsRef.current) { ... }
    // if (video.canPlayType(...) { ... }
    // else if (Hls.isSupported()) { ... }

    // Configurar diretamente o src para a tag <video>
    video.src = videoUrl;

    // Configurar o vídeo
    video.currentTime = startAt;
    video.muted = muted;

    // Tentar tocar se autoPlay estiver ativo
    if (autoPlay) {
        video.play();
    }

    // Adicionar event listeners
    const handleTimeUpdate = () => {
      if (onProgress && video.duration && !isNaN(video.duration)) {
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
      // --- Lógica de destruição do HLS removida ---
      // if (hlsRef.current) { ... }
    };
  }, [videoUrl, autoPlay, muted, startAt, onProgress, onEnd]);

  if (isError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <p>Erro ao carregar o vídeo.</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className={className}
      controls={controls}
      playsInline // Importante para reprodução inline em mobile
      poster={thumbnail}
      // Não é necessário autoPlay aqui se for tratado no useEffect
      // A propriedade `muted` também é definida no useEffect
      // O `src` é definido no useEffect
    />
  );
}

