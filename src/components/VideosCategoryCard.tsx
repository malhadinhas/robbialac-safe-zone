import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "@/types";
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { getSecureR2Url } from '@/services/videoService';
import VideoThumbnail from '@/components/VideoThumbnail';
import { Skeleton } from "@/components/ui/skeleton";

interface VideosCategoryCardProps {
  category: string;
  displayTitle: string;
  description: string;
  videos: Video[];
  count: number;
  color: string;
}

function VideosCategoryCard({ category, displayTitle, description, videos, count, color }: VideosCategoryCardProps) {
  const [hoveredVideo, setHoveredVideo] = useState<Video | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const getIcon = (category: string) => {
    switch (category) {
      case 'Segurança':
        return '🛡️';
      case 'Qualidade':
        return '✨';
      case 'Procedimentos e Regras':
        return '📋';
      default:
        return '📌';
    }
  };

  const fetchVideoUrl = async (video: Video) => {
    try {
      setIsLoadingVideo(true);
      const url = await getSecureR2Url(video.r2VideoKey);
      setVideoUrl(url);
    } catch (error) {
      toast.error('Erro ao carregar vídeo');
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleMouseEnter = async (video: Video) => {
    setHoveredVideo(video);
    await fetchVideoUrl(video);
  };

  const handleMouseLeave = () => {
    setHoveredVideo(null);
    setVideoUrl(null);
  };

  return (
    <Card 
      className="relative overflow-hidden transition-all duration-300 hover:shadow-lg"
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span>{getIcon(category)}</span>
          <span>{displayTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-4">
          {description}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium" style={{ color }}>
            {count} {count === 1 ? 'vídeo' : 'vídeos'}
          </div>
          {videos.length > 0 && (
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span className="text-sm">Passe o mouse para ver</span>
            </div>
          )}
        </div>
        {hoveredVideo && (
          <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-4">
            {isLoadingVideo ? (
              <Skeleton className="w-full h-[200px]" />
            ) : videoUrl ? (
              <video
                src={videoUrl}
                className="w-full max-h-[200px] object-contain"
                autoPlay
                muted
                loop
                playsInline
                onError={() => toast.error('Erro ao reproduzir vídeo')}
              />
            ) : null}
          </div>
        )}
      </CardContent>
      {videos.length > 0 && (
        <div className="absolute inset-0 grid grid-cols-2 gap-1 opacity-0 hover:opacity-100">
          {videos.slice(0, 4).map((video) => (
            <div
              key={video.id}
              className="relative aspect-video cursor-pointer"
              onMouseEnter={() => handleMouseEnter(video)}
            >
              <VideoThumbnail
                thumbnailR2Key={video.r2ThumbnailKey}
                altText={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default VideosCategoryCard;
