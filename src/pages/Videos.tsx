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
import { VideoCardItem } from '@/components/VideoCardItem';

export default function Videos() {
  const { zone } = useParams<{ zone: string }>();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
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
          toast.error('Erro ao carregar vídeos: formato inválido');
          setVideos([]);
          setLoading(false);
          return;
        }

        // Filtra primeiro para pegar apenas vídeos prontos (comparação mais robusta)
        const readyVideos = allVideos.filter(video => 
          typeof video.status === 'string' && video.status.trim().toLowerCase() === 'ready'
        );

        // Garantir que videosToDisplay é sempre um array
        let videosToDisplay: Video[] = []; 

        if (zone) {
          const normalizedZoneParam = zone.charAt(0).toUpperCase() + zone.slice(1).toLowerCase();
          
          // Filtra os vídeos prontos pela zona
          const filteredReadyVideos = readyVideos.filter(video => {
            const videoZone = video.zone;
            const isMatch = videoZone && videoZone.toLowerCase() === normalizedZoneParam.toLowerCase();
            return isMatch;
          });

          if (filteredReadyVideos.length === 0 && readyVideos.length > 0) {
            const allReadyZones = Array.from(new Set(readyVideos.map(v => v.zone).filter(Boolean)));
          }
          
          videosToDisplay = filteredReadyVideos;
        } else {
          // Se não houver zona, mostrar todos os vídeos prontos
          videosToDisplay = readyVideos; 
        }
        
        setVideos(videosToDisplay);
      } catch (error) {
        console.error('Erro detalhado ao carregar vídeos', { 
          error,
          zone,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
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
          (() => {
            if (videos.length === 0) {
              return (
                <div className="text-center py-12 border rounded-lg bg-gray-50">
                  <p className="text-gray-500">Nenhum vídeo disponível para esta zona.</p>
                </div>
              );
            } else {
              // Calcula categorias aqui dentro
              const videosByCategory: Record<string, Video[]> = {};
              videos.forEach(video => {
                const categoryKey = video.category || 'Sem Categoria'; 
                if (!videosByCategory[categoryKey]) {
                  videosByCategory[categoryKey] = [];
                }
                videosByCategory[categoryKey].push(video);
              });
              const categories = Object.keys(videosByCategory);

              // Segurança: caso raro de vídeos sem categorias válidas
              if (categories.length === 0) {
                 return (
                  <div className="text-center py-12 border rounded-lg bg-gray-50">
                    <p className="text-gray-500">Nenhuma categoria encontrada para os vídeos disponíveis.</p>
                  </div>
                );
              }

              // Renderiza as Tabs
              return (
                <Tabs defaultValue={categories[0]} className="space-y-6">
                  <TabsList>
                    {categories.map(category => (
                      <TabsTrigger key={category} value={category}>
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {Object.entries(videosByCategory).map(([category, categoryVideos]) => (
                    <TabsContent key={category} value={category}>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {categoryVideos.map(video => (
                          <VideoCardItem key={video.id || video._id} video={video} />
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
              );
            }
          })()
        )}
      </div>
    </Layout>
  );
}
