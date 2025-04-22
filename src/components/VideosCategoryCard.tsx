import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "@/types";
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { getSecureR2Url } from '@/services/videoService';
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
      className="relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
      onMouseEnter={() => videos.length > 0 && handleMouseEnter(videos[0])}
      onMouseLeave={handleMouseLeave}
    >
      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span>{getIcon(category)}</span>
          <span>{displayTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative min-h-[120px]">
        {hoveredVideo ? (
          <div className="absolute inset-0 bg-background">
            {isLoadingVideo ? (
              <div className="w-full h-full flex items-center justify-center">
                <Skeleton className="w-full h-[100px]" />
              </div>
            ) : videoUrl ? (
              <div className="p-2">
                <video
                  src={videoUrl}
                  className="w-full h-[100px] object-contain bg-black/5 rounded-md"
                  autoPlay
                  muted
                  loop
                  playsInline
                  onError={() => toast.error('Erro ao reproduzir vídeo')}
                />
                <div className="mt-2">
                  <h3 className="font-medium text-sm">{hoveredVideo.title}</h3>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <>
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default VideosCategoryCard;
