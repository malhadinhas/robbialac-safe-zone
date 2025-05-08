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
  
  const ALL_CATEGORIES = ['Segurança', 'Qualidade', 'Procedimentos'];
  
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
      <div className="bg-[#f7faff] min-h-screen py-8 flex flex-col items-center">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex items-center mb-8 px-2 sm:px-0">
            <Button variant="ghost" onClick={handleBackClick} className="mr-4 text-[#1E90FF] hover:bg-[#e6f0fa] rounded-full px-5 py-2 font-semibold text-base">
              <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </Button>
            <h1 className="text-3xl font-bold text-gray-900">Vídeos - {zoneTitle}</h1>
        </div>
          <div className="h-4" />
        {loading ? (
          <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E90FF]"></div>
          </div>
        ) : (
          (() => {
            if (videos.length === 0) {
              return (
                  <div className="text-center py-12 border rounded-2xl bg-white shadow-md">
                    <p className="text-gray-500 text-lg">Nenhum vídeo disponível para esta zona.</p>
                </div>
              );
            } else {
                // Agrupar vídeos por categoria
              const videosByCategory: Record<string, Video[]> = {};
                ALL_CATEGORIES.forEach(cat => { videosByCategory[cat] = []; });
              videos.forEach(video => {
                  const categoryKey = ALL_CATEGORIES.includes(video.category) ? video.category : 'Procedimentos';
                videosByCategory[categoryKey].push(video);
              });
                 return (
                  <Tabs defaultValue={ALL_CATEGORIES[0]} className="space-y-8 w-full">
                    <TabsList className="bg-white rounded-full shadow p-1 flex gap-2 mb-6">
                      {ALL_CATEGORIES.map(category => (
                        <TabsTrigger key={category} value={category} className="rounded-full px-6 py-2 text-base font-semibold data-[state=active]:bg-[#1E90FF] data-[state=active]:text-white data-[state=inactive]:text-[#1E90FF] data-[state=inactive]:bg-white transition">
                        {category}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                    {ALL_CATEGORIES.map(category => (
                      <TabsContent key={category} value={category} className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                          {videosByCategory[category].map(video => (
                          <VideoCardItem key={video.id || video._id} video={video} />
                        ))}
                      </div>
                        {videosByCategory[category].length === 0 && (
                          <div className="text-center py-12 border rounded-2xl bg-white shadow-md mt-6">
                            <p className="text-gray-500 text-lg">Nenhum vídeo disponível nesta categoria.</p>
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
      </div>
    </Layout>
  );
}
