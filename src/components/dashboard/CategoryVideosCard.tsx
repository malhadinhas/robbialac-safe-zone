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
    <Card className="h-fit col-span-2">
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">Vídeos por Categoria</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="grid grid-cols-3 gap-4">
          {categories.map(category => {
            const video = getLatestVideoByCategory(category);
            const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS];
            const colorClass = CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS];

            return (
              <div
                key={category}
                className={`group relative flex flex-col overflow-hidden rounded-lg border border-gray-100 hover:border-gray-200 transition-all ${video ? '' : 'opacity-50'}`}
                onClick={() => video && handleVideoClick(video.id)}
              >
                <div className={`flex items-center p-3 ${colorClass}`}>
                  <Icon className="w-5 h-5 mr-2" />
                  <p className="text-sm font-medium truncate">
                    {category}
                  </p>
                </div>
                
                {video && (
                  <>
                    <div className="relative w-full aspect-video">
                      <VideoThumbnail video={video} />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {video.title}
                      </p>
                    </div>
                  </>
                )}
                
                {!video && (
                  <div className="p-3 text-center text-sm text-gray-500">
                    Nenhum vídeo disponível
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 