import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "@/types";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { getVideos, getSecureR2Url } from '@/services/videoService';
import VideoThumbnail from '@/components/VideoThumbnail';
import { Skeleton } from "@/components/ui/skeleton";

interface VideosCategoryCardProps {
  category: string;
  displayTitle: string;
  description: string;
}

const HoverVideoPreview = ({ video }: { video: Video }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const navigate = useNavigate();

  const fetchVideoUrl = async () => {
    if (!video.r2Key || videoUrl) return;
    setIsLoadingUrl(true);
    try {
      const response = await getSecureR2Url(video.r2Key);
      setVideoUrl(response.secureUrl);
    } catch (error) {
      console.error("Erro ao buscar URL segura do vídeo:", error);
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    fetchVideoUrl();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  const handleClick = () => {
    navigate(`/videos/visualizar/${video.id}`);
  };

  return (
    <div 
      className="relative aspect-video w-full cursor-pointer group overflow-hidden rounded border"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className={`transition-opacity duration-300 ${isHovering && videoUrl ? 'opacity-0' : 'opacity-100'}`}>
        <VideoThumbnail thumbnailR2Key={video.thumbnailR2Key} altText={video.title} />
      </div>

      {isHovering && videoUrl && (
        <video
          key={video.id}
          className="absolute inset-0 w-full h-full object-cover bg-black"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          onError={(e) => console.error("Erro ao carregar vídeo preview:", e)}
        />
      )}
      
      {isHovering && isLoadingUrl && (
         <div className="absolute inset-0 flex items-center justify-center bg-black/50">
             <Skeleton className="h-8 w-8 rounded-full animate-spin" />
         </div>
      )}
      
       <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <p className="text-white text-xs font-medium line-clamp-1">{video.title}</p>
       </div>
       
       <div className="absolute inset-0 flex items-center justify-center opacity-70 pointer-events-none">
           <div className="bg-black/50 text-white rounded-full p-1.5">
               <Play size={16} />
           </div>
       </div>
    </div>
  );
};

const VideosCategoryCard = ({ category, displayTitle, description }: VideosCategoryCardProps) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryVideos = async () => {
      setLoading(true);
      try {
        const fetchedVideos = await getVideos({ category: category, limit: '2' });
        const validVideos = fetchedVideos.filter(v => v.r2Key && v.thumbnailR2Key);
        if (validVideos.length < fetchedVideos.length) {
            console.warn(`Alguns vídeos da categoria ${category} não têm r2Key ou thumbnailR2Key.`);
        }
        setVideos(validVideos.slice(0, 2));
      } catch (error) {
        console.error(`Erro ao buscar vídeos para a categoria ${category}:`, error);
        toast.error(`Erro ao carregar vídeos de ${displayTitle}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryVideos();
  }, [category]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{displayTitle}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription> 
      </CardHeader>
      <CardContent className="flex-grow space-y-4"> 
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="aspect-video w-full rounded" />
            <Skeleton className="aspect-video w-full rounded" />
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-2 gap-2"> 
            {videos.map((video) => (
              <HoverVideoPreview key={video.id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>Nenhum vídeo de pré-visualização disponível.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideosCategoryCard;
