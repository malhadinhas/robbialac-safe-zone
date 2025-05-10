import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "@/types";
import { Play } from 'lucide-react';
import { toast } from 'sonner';
import { getSecureR2Url } from '@/services/videoService';
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from 'react-router-dom';

interface VideosCategoryCardProps {
  category: string;
  displayTitle: string;
  description: string;
  videos: Video[];
  count: number;
  color: string;
}

function VideosCategoryCard({ category, displayTitle, description, videos, count, color }: VideosCategoryCardProps) {
  const navigate = useNavigate();
  const video = videos[0];
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchThumbnail = async () => {
      if (video && video.r2ThumbnailKey) {
        try {
          const url = await getSecureR2Url(video.r2ThumbnailKey);
          setThumbnailUrl(url);
        } catch {
          setThumbnailUrl(null);
        }
      } else {
        setThumbnailUrl(null);
      }
    };
    fetchThumbnail();
  }, [video]);

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

  const handleGoToVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video) {
      navigate(`/videos/visualizar/${video.id || video._id}`);
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-white rounded-2xl shadow-md overflow-hidden transition-all min-h-[320px] hover:shadow-lg cursor-pointer"
      onClick={handleGoToVideo}
    >
      {/* Header da categoria */}
      <div className={`flex items-center px-5 py-3 ${
        category === 'Segurança' ? 'bg-red-50 text-red-500' :
        category === 'Qualidade' ? 'bg-blue-50 text-blue-500' :
        'bg-green-50 text-green-500'
      } rounded-t-2xl`}> 
        <span className="mr-2 text-xl">{getIcon(category)}</span>
        <p className="text-base font-semibold truncate">
          {displayTitle}
        </p>
      </div>
      {video ? (
        <>
          <div className="relative w-full aspect-video bg-gray-100">
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <Play className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <button
              className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg p-3 flex items-center justify-center opacity-90 group-hover:opacity-100 transition"
              title="Ver vídeo"
              onClick={handleGoToVideo}
            >
              <Play className="w-5 h-5" />
            </button>
                </div>
          <div className="px-5 py-4 flex-1 flex items-end">
            <p className="text-base font-semibold text-gray-800 truncate w-full">
              {video.title}
            </p>
          </div>
        </>
        ) : (
        <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 h-full min-h-[180px] px-5 py-8 rounded-b-2xl">
          <p className="text-gray-400 text-base font-medium">Nenhum vídeo disponível</p>
                </div>
              )}
            </div>
  );
}

export default VideosCategoryCard;
