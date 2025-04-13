import React, { useRef, useEffect, useState } from 'react';
import { setupHlsPlayer, PlayerOptions, isHlsSupported } from '@/services/videoPlayerService';
import { toast } from 'sonner';

interface HLSVideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  startAt?: number;
  onProgress?: (progress: number, currentTime: number) => void;
  onEnd?: () => void;
  className?: string;
  thumbnail?: string;
}

export const HLSVideoPlayer = ({
  videoUrl,
  autoPlay = false,
  controls = true,
  muted = false,
  startAt = 0,
  onProgress,
  onEnd,
  className = '',
  thumbnail
}: HLSVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    
    const options: PlayerOptions = {
      autoplay: autoPlay,
      controls: controls,
      muted: muted,
      startTime: startAt
    };
    
    try {
      console.log('Iniciando player com URL:', videoUrl);
      const { attachPlayer, destroyPlayer } = setupHlsPlayer();
      attachPlayer(videoRef.current, videoUrl, options);
      
      const videoElement = videoRef.current;
      
      // Event handlers
      const handleProgress = () => {
        if (!videoElement) return;
        
        const duration = videoElement.duration || 0;
        if (duration > 0) {
          const progressPercent = (videoElement.currentTime / duration) * 100;
          onProgress?.(progressPercent, videoElement.currentTime);
        }
      };
      
      const handleEnded = () => {
        onEnd?.();
      };
      
      const handleError = (e: ErrorEvent) => {
        console.error('Erro no player de vídeo:', e);
        setError(new Error('Erro ao reproduzir o vídeo'));
        toast.error('Erro ao reproduzir o vídeo. Tentando novamente...');
      };
      
      const handleLoadedData = () => {
        setIsLoading(false);
        console.log('Vídeo carregado com sucesso');
      };
      
      // Attach events
      videoElement.addEventListener('timeupdate', handleProgress);
      videoElement.addEventListener('ended', handleEnded);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      
      return () => {
        videoElement.removeEventListener('timeupdate', handleProgress);
        videoElement.removeEventListener('ended', handleEnded);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        destroyPlayer();
      };
    } catch (err) {
      console.error('Erro ao configurar player:', err);
      setError(err instanceof Error ? err : new Error('Erro ao configurar player'));
      toast.error('Erro ao configurar player de vídeo');
    }
  }, [videoUrl, autoPlay, controls, muted, startAt, onProgress, onEnd]);
  
  if (error || !isHlsSupported()) {
    return (
      <div className={`relative ${className}`}>
        {thumbnail && (
          <img 
            src={thumbnail} 
            alt="Video thumbnail" 
            className="w-full h-full object-contain"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-center p-4">
          <p>
            {error ? 
              'Erro ao reproduzir o vídeo. Por favor, tente novamente mais tarde.' :
              'Seu navegador não suporta a reprodução deste formato de vídeo.'
            }
          </p>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-robbialac"></div>
      </div>
    );
  }
  
  return (
    <video
      ref={videoRef}
      className={`w-full h-full ${className}`}
      playsInline
    />
  );
};

export default HLSVideoPlayer;

