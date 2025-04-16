import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Video } from "@/types";
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { getSecureR2Url } from '@/services/videoService';
import VideoThumbnail from '@/components/VideoThumbnail';
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VideoCardItemProps {
  video: Video;
}

export const VideoCardItem = ({ video }: VideoCardItemProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const navigate = useNavigate();

  const fetchVideoUrl = async () => {
    // Usar a chave correta do vídeo
    const videoKey = video.r2VideoKey || video.r2Key; 
    if (!videoKey || videoUrl) return; // Não buscar se já tem URL ou não tem chave

    setIsLoadingUrl(true);
    try {
      const response = await getSecureR2Url(videoKey);
      setVideoUrl(response);
    } catch (error) {
      console.error(`[VideoCardItem] Erro ao buscar URL para videoKey: ${videoKey}`, error);
      toast.error("Erro ao buscar URL segura do vídeo.");
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    // Só busca a URL se ainda não a tivermos
    if (!videoUrl) {
      fetchVideoUrl();
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Opcional: Poderíamos limpar a videoUrl aqui para economizar recursos, 
    // mas pode causar recarregamento se o usuário voltar a passar o rato rapidamente.
    // setVideoUrl(null); 
  };

  const handleClick = () => {
    navigate(`/videos/visualizar/${video.id || video._id}`);
  };

  return (
    <Card
      key={video.id || video._id} // Garantir key aqui
      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative aspect-video">
        {/* Thumbnail visível por padrão ou quando não está hover/loading */}
        <div className={`transition-opacity duration-300 ${isHovering && videoUrl ? 'opacity-0' : 'opacity-100'}`}>
          <VideoThumbnail
            thumbnailR2Key={video.r2ThumbnailKey}
            alt={video.title}
          />
        </div>

        {/* Elemento Video é renderizado e toca quando hover E a URL foi carregada */}
        {isHovering && videoUrl && (
          <video
            key={`${video.id}-player`} // Key diferente para forçar remount se necessário
            className="absolute inset-0 w-full h-full object-cover bg-black"
            src={videoUrl}
            autoPlay
            muted
            loop
            playsInline
            onError={(e) => {
              toast.error(`Falha ao carregar preview: ${video.title}`);
              setVideoUrl(null); // Limpa a URL se o vídeo falhar, voltando para thumbnail
            }}
          />
        )}

        {/* Loading spinner enquanto busca URL do vídeo no hover */}
        {isHovering && isLoadingUrl && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/50">
               <Skeleton className="h-8 w-8 rounded-full animate-spin" />
           </div>
        )}

        {/* Ícone de Play (pode ser removido ou ajustado se o vídeo já toca) */}
        {isHovering && !isLoadingUrl && !videoUrl && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-none">
            <Play className="h-12 w-12 text-white opacity-70" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium text-lg line-clamp-2 mb-1">{video.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{video.views} visualizações</span>
          <span>
            {video.uploadDate
              ? formatDistanceToNow(new Date(video.uploadDate), {
                  addSuffix: true,
                  locale: ptBR
                })
              : 'Data indisponível'
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}; 