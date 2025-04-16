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
    const videoKey = video.r2Key || video.r2VideoKey;
    if (!videoKey || videoUrl) return;
    
    setIsLoadingUrl(true);
    try {
      const response = await getSecureR2Url(videoKey);
      setVideoUrl(response);
    } catch (error) {
      toast.error("Erro ao buscar URL segura do vídeo.");
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
    <div className="space-y-1">
      <div 
        className="relative aspect-video w-full cursor-pointer group overflow-hidden rounded-md border transition-all duration-300 hover:shadow-md"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        <div className={`transition-opacity duration-300 ${isHovering && videoUrl ? 'opacity-0' : 'opacity-100'}`}>
          <VideoThumbnail 
            thumbnailR2Key={video.thumbnailR2Key || video.r2ThumbnailKey} 
            altText={video.title} 
          />
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
            onError={(e) => {
              console.error('Erro ao carregar preview do vídeo:', e);
              toast.error(`Falha ao carregar preview: ${video.title}`);
            }}
          />
        )}
        
        {isHovering && isLoadingUrl && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50">
               <Skeleton className="h-8 w-8 rounded-full animate-spin" />
           </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <p className="text-white text-sm font-medium line-clamp-1">{video.title}</p>
        </div>
         
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-90 transition-opacity duration-300 pointer-events-none">
          <div className="bg-black/60 text-white rounded-full p-3 transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play size={24} />
          </div>
        </div>
      </div>
      
      {/* Título do vídeo fora da miniatura */}
      <div className="w-full px-1">
        <h4 className="text-sm font-medium line-clamp-2">{video.title}</h4>
        <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
          <span>{video.views || 0} visualizações</span>
          <span>{Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  );
};

const VideosCategoryCard = ({ category, displayTitle, description }: VideosCategoryCardProps) => {
  // --- LOG DE TESTE INICIAL ---
  console.log(`[VideosCategoryCard] Renderizando para Categoria: ${category}, Título: ${displayTitle}`);
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryVideos = async () => {
      setLoading(true);
      try {
        const fetchedVideos = await getVideos({ category: category, limit: '4' });
        const validVideos = fetchedVideos.filter(v => v.r2Key && v.thumbnailR2Key);
        setVideos(validVideos.slice(0, 4));
      } catch (error) {
        toast.error(`Erro ao carregar vídeos de ${displayTitle}.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryVideos();
  }, [category]);

  // Mapeamento de categorias para cores claras
  const categoryColors: Record<string, { bg: string, border: string, accent: string }> = {
    'Segurança': { bg: 'bg-red-50', border: 'border-red-200', accent: 'text-red-700' },
    'Treinamento': { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'text-blue-700' },
    'Procedimentos': { bg: 'bg-green-50', border: 'border-green-200', accent: 'text-green-700' },
    'Equipamentos': { bg: 'bg-yellow-50', border: 'border-yellow-200', accent: 'text-yellow-700' },
    'Outros': { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'text-purple-700' },
    'default': { bg: 'bg-gray-50', border: 'border-gray-200', accent: 'text-gray-700' }
  };

  // Selecionar a cor adequada para a categoria
  const colorInfo = categoryColors[category] || categoryColors['default'];
  const colorClass = `${colorInfo.bg} border ${colorInfo.border}`;
  const accentClass = colorInfo.accent;

  // Preparar os títulos dos cards
  const lastSeenTitle = videos.length > 0 ? "Último assistido" : "";
  const recommendedTitle = videos.length > 1 ? "Recomendado para você" : "";

  return (
    <Card className={`h-full flex flex-col ${colorClass} shadow-sm transition-shadow hover:shadow-md`}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-lg ${accentClass}`}>{displayTitle}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription> 
      </CardHeader>
      <CardContent className="flex-grow space-y-4"> 
        {loading ? (
          <div className="space-y-4">
            <div className="w-full">
              <Skeleton className="aspect-video w-full rounded-md" />
              <Skeleton className="h-5 w-3/4 mt-2" />
            </div>
            <div className="w-full">
              <Skeleton className="aspect-video w-full rounded-md" />
              <Skeleton className="h-5 w-3/4 mt-2" />
            </div>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-4">
            {/* Último vídeo visto */}
            <div className="space-y-1">
              {lastSeenTitle && (
                <div className={`text-xs font-medium ${accentClass} mb-1 flex items-center space-x-1`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                  <span>{lastSeenTitle}</span>
                </div>
              )}
              {videos[0] && <HoverVideoPreview key={videos[0].id} video={videos[0]} />}
            </div>
            
            {/* Vídeo recomendado */}
            {videos.length > 1 && (
              <div className="space-y-1">
                {recommendedTitle && (
                  <div className={`text-xs font-medium ${accentClass} mb-1 flex items-center space-x-1`}>
                    <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
                    <span>{recommendedTitle}</span>
                  </div>
                )}
                {videos[1] && <HoverVideoPreview key={videos[1].id} video={videos[1]} />}
              </div>
            )}
            
            {/* Mensagem caso tenha apenas um vídeo */}
            {videos.length === 1 && (
              <div className="aspect-video flex items-center justify-center border border-dashed rounded-md p-2 text-center">
                <div className="text-gray-500 text-xs">
                  <p>Assista mais vídeos para receber recomendações</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>Nenhum vídeo de pré-visualização disponível.</p>
            <p className="mt-2 text-xs">Adicione vídeos a esta categoria para que apareçam aqui</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideosCategoryCard;
