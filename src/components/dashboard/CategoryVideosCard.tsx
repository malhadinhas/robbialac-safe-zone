import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Gauge, BookOpen, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSecureR2Url } from '@/services/videoService';

interface Video {
  id: string;
  title: string;
  category: string;
  thumbnailR2Key?: string;
  r2ThumbnailKey?: string;
}

interface CategoryVideosCardProps {
  videos: Video[];
}

const CATEGORY_ICONS = {
  'Segurança': Shield,
  'Qualidade': Gauge,
  'Procedimentos e Regras': BookOpen,
};

const CATEGORY_COLORS = {
  'Segurança': 'text-red-500 bg-red-50',
  'Qualidade': 'text-blue-500 bg-blue-50',
  'Procedimentos e Regras': 'text-green-500 bg-green-50',
};

const VideoThumbnail = ({ video }: { video: Video }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadThumbnail = async () => {
      const thumbnailKey = video.thumbnailR2Key || video.r2ThumbnailKey;
      if (thumbnailKey) {
        try {
          const url = await getSecureR2Url(thumbnailKey);
          setThumbnailUrl(url);
        } catch (error) {
          console.error('Erro ao carregar thumbnail:', error);
        }
      }
    };
    
    loadThumbnail();
  }, [video]);

  if (!thumbnailUrl) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <Play className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <img 
      src={thumbnailUrl} 
      alt={video.title}
      className="w-full h-full object-cover"
      loading="lazy"
    />
  );
};

export function CategoryVideosCard({ videos }: CategoryVideosCardProps) {
  const navigate = useNavigate();

  // Pega o vídeo mais recente de cada categoria
  const getLatestVideoByCategory = (category: string) => {
    return videos.find(video => video.category === category);
  };

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/visualizar/${videoId}`);
  };

  const categories = ['Segurança', 'Qualidade', 'Procedimentos e Regras'];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {categories.map(category => {
            const video = getLatestVideoByCategory(category);
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
            const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

            return (
              <div
                key={category}
            className={`group relative flex flex-col bg-white rounded-2xl shadow-md overflow-hidden transition-all min-h-[320px] ${video ? 'hover:shadow-lg cursor-pointer' : 'opacity-60'}`}
                onClick={() => video && handleVideoClick(video.id)}
              >
            {/* Header da categoria */}
            <div className={`flex items-center px-5 py-3 ${colorClass} rounded-t-2xl`}> 
                  <Icon className="w-5 h-5 mr-2" />
              <p className="text-base font-semibold truncate">
                    {category}
                  </p>
                </div>
            {video ? (
                  <>
                <div className="relative w-full aspect-video bg-gray-100">
                      <VideoThumbnail video={video} />
                  <button
                    className="absolute bottom-3 right-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg p-3 flex items-center justify-center opacity-90 group-hover:opacity-100 transition"
                    onClick={e => { e.stopPropagation(); handleVideoClick(video.id); }}
                    title="Ver vídeo"
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
              <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 h-full min-h-[180px] px-5 py-8">
                <p className="text-gray-400 text-base font-medium">Nenhum vídeo disponível</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
  );
} 