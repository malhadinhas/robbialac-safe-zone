
import { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { mockVideos } from "@/services/mockData";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Video } from "@/types";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';

export default function Videos() {
  const { zone } = useParams<{ zone: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  
  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  
  const zoneTitle = zone ? capitalizeFirstLetter(zone) : '';
  
  useEffect(() => {
    if (zone) {
      // Filtrar vídeos pela zona (área da fábrica)
      const filteredVideos = mockVideos.filter(
        video => video.zone.toLowerCase() === zone.toLowerCase()
      );
      setVideos(filteredVideos);
    }
  }, [zone]);
  
  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/visualizar/${videoId}`);
  };
  
  const handleBackClick = () => {
    navigate('/formacoes');
  };
  
  // Agrupar vídeos por categoria
  const videosByCategory: Record<string, Video[]> = {};
  videos.forEach(video => {
    if (!videosByCategory[video.category]) {
      videosByCategory[video.category] = [];
    }
    videosByCategory[video.category].push(video);
  });
  
  return (
    <Layout>
      <div className="mb-6 flex items-center">
        <Button variant="ghost" onClick={handleBackClick} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Vídeos: Área de {zoneTitle}</h1>
          <p className="text-gray-600">Explore os vídeos disponíveis para esta área da fábrica</p>
        </div>
      </div>
      
      <Tabs defaultValue="Segurança">
        <TabsList className="mb-6">
          {Object.keys(videosByCategory).map(category => (
            <TabsTrigger key={category} value={category} className="px-6">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.entries(videosByCategory).map(([category, categoryVideos]) => (
          <TabsContent key={category} value={category}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryVideos.map(video => (
                <Card 
                  key={video.id}
                  className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                  onClick={() => handleVideoClick(video.id)}
                  onMouseEnter={() => setHoveredVideo(video.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  <div className="relative aspect-video bg-gray-200">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      className="w-full h-full object-cover"
                    />
                    {hoveredVideo === video.id && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3">
                          <Play className="h-8 w-8 text-robbialac" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-lg line-clamp-2 mb-1">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{video.views} visualizações</span>
                      <span>
                        {formatDistanceToNow(new Date(video.uploadDate), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {categoryVideos.length === 0 && (
              <div className="text-center py-12 border rounded-lg bg-gray-50">
                <p className="text-gray-500">Nenhum vídeo disponível nesta categoria.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
}
