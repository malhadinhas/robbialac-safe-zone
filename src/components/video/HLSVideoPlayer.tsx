
import React, { useRef, useEffect } from 'react';
import { setupHlsPlayer, PlayerOptions } from '@/services/videoPlayerService';

interface HLSVideoPlayerProps {
  videoUrl: string;
  autoPlay?: boolean;
  controls?: boolean;
  muted?: boolean;
  startAt?: number;
  onProgress?: (progress: number, currentTime: number) => void;
  onEnd?: () => void;
  className?: string;
}

export const HLSVideoPlayer = ({
  videoUrl,
  autoPlay = false,
  controls = true,
  muted = false,
  startAt = 0,
  onProgress,
  onEnd,
  className = ''
}: HLSVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  useEffect(() => {
    if (!videoRef.current || !videoUrl) return;
    
    const options: PlayerOptions = {
      autoplay: autoPlay,
      controls: controls,
      muted: muted,
      startTime: startAt
    };
    
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
    
    // Attach events
    videoElement.addEventListener('timeupdate', handleProgress);
    videoElement.addEventListener('ended', handleEnded);
    
    return () => {
      videoElement.removeEventListener('timeupdate', handleProgress);
      videoElement.removeEventListener('ended', handleEnded);
      destroyPlayer();
    };
  }, [videoUrl, autoPlay, controls, muted, startAt, onProgress, onEnd]);
  
  return (
    <video
      ref={videoRef}
      className={`w-full h-full ${className}`}
      playsInline
    />
  );
};

export default HLSVideoPlayer;

