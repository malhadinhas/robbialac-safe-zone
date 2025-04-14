import { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Video } from "@/types";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';
import { getVideos } from '@/services/videoService';
import { toast } from 'sonner';
import logger from '@/utils/logger';

export default function Videos() {
  const { zone } = useParams<{ zone: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const capitalizeFirstLetter = (string: string) => {
    return string?.charAt(0).toUpperCase() + string?.slice(1).toLowerCase() || '';
  };
  
  const zoneTitle = zone ? capitalizeFirstLetter(zone) : '';
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const allVideos = await getVideos();
        
        if (!Array.isArray(allVideos)) {
          logger.error('Dados de vídeos inválidos', { received: allVideos });
          toast.error('Erro ao carregar vídeos: formato inválido');
          setVideos([]);
          return;
        }

        if (zone) {
          const normalizedZone = zone.charAt(0).toUpperCase() + zone.slice(1).toLowerCase();
          const filteredVideos = allVideos.filter(video => 
            video.zone && video.zone.toLowerCase() === zone.toLowerCase()
          );
          
          if (filteredVideos.length === 0) {
            logger.warn('Nenhum vídeo encontrado para a zona', { zone, totalVideos: allVideos.length });
          }
          
          setVideos(filteredVideos);
        } else {
          setVideos(allVideos);
        }
      } catch (error) {
        logger.error('Erro ao carregar vídeos', { 
          error,
          zone,
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
        toast.error('Erro ao carregar vídeos. Por favor, tente novamente.');
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
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

  // Se não houver vídeos, mostrar mensagem apropriada
  if (!loading && videos.length === 0) {
    return (
      <Layout>
        <div className="container mx-auto py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={handleBackClick} className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Vídeos - {zoneTitle}</h1>
          </div>
          <div className="text-center py-12 border rounded-lg bg-gray-50">
            <p className="text-gray-500">Nenhum vídeo disponível para esta zona.</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBackClick} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Vídeos - {zoneTitle}</h1>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-robbialac"></div>
          </div>
        ) : (
          <Tabs defaultValue={Object.keys(videosByCategory)[0]} className="space-y-6">
            <TabsList>
              {Object.keys(videosByCategory).map(category => (
                <TabsTrigger key={category} value={category}>
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
                      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                      onClick={() => handleVideoClick(video.id)}
                      onMouseEnter={() => setHoveredVideo(video.id)}
                      onMouseLeave={() => setHoveredVideo(null)}
                    >
                      <div className="relative aspect-video">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        {hoveredVideo === video.id && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        )}
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
        )}
      </div>
    </Layout>
  );
}
