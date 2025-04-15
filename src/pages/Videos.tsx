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
import { VideoThumbnail } from '@/components/video/VideoThumbnail';

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
      logger.info(`Iniciando busca de vídeos para zona: ${zone}`);
      try {
        setLoading(true);
        const allVideos = await getVideos();
        logger.info(`Vídeos recebidos da API: ${allVideos?.length ?? 0}`, { firstVideo: allVideos?.[0] });
        
        if (!Array.isArray(allVideos)) {
          logger.error('Dados de vídeos inválidos recebidos da API', { received: allVideos });
          toast.error('Erro ao carregar vídeos: formato inválido');
          setVideos([]);
          setLoading(false);
          return;
        }

        // Log detalhado dos status recebidos ANTES de filtrar
        logger.info('Verificando status dos vídeos recebidos:', allVideos.map(v => ({ id: v.id, status_recebido: v.status, tipo: typeof v.status })));

        // Filtra primeiro para pegar apenas vídeos prontos (comparação mais robusta)
        const readyVideos = allVideos.filter(video => 
          typeof video.status === 'string' && video.status.trim().toLowerCase() === 'ready'
        );
        logger.info(`Vídeos filtrados como 'ready' (comparação robusta): ${readyVideos.length}`);

        let videosToDisplay = readyVideos;

        if (zone) {
          const normalizedZoneParam = zone.charAt(0).toUpperCase() + zone.slice(1).toLowerCase();
          logger.info(`Zona normalizada do parâmetro URL: '${normalizedZoneParam}'`);
          
          // Filtra os vídeos prontos pela zona
          const filteredReadyVideos = readyVideos.filter(video => {
            const videoZone = video.zone;
            const isMatch = videoZone && videoZone.toLowerCase() === normalizedZoneParam.toLowerCase();
            return isMatch;
          });
          
          logger.info(`Vídeos prontos após filtro para zona '${normalizedZoneParam}': ${filteredReadyVideos.length}`, { 
            firstFilteredVideo: filteredReadyVideos?.[0] 
          });

          if (filteredReadyVideos.length === 0 && readyVideos.length > 0) {
            logger.warn(`Nenhum vídeo pronto encontrado para a zona '${normalizedZoneParam}', mas ${readyVideos.length} vídeos prontos totais recebidos. Verifique a correspondência de zona.`);
            const allReadyZones = Array.from(new Set(readyVideos.map(v => v.zone).filter(Boolean)));
            logger.warn(`Zonas presentes nos vídeos prontos recebidos:`, allReadyZones);
          }
          
          videosToDisplay = filteredReadyVideos;
        } else {
          logger.info('Nenhuma zona especificada, exibindo todos os vídeos prontos.');
        }
        
        setVideos(videosToDisplay);
      } catch (error) {
        logger.error('Erro detalhado ao carregar vídeos', { 
          error,
          zone,
          message: error instanceof Error ? error.message : 'Erro desconhecido',
          stack: error instanceof Error ? error.stack : undefined
        });
        toast.error('Erro ao carregar vídeos. Por favor, tente novamente.');
        setVideos([]);
      } finally {
        setLoading(false);
        logger.info(`Busca de vídeos finalizada para zona: ${zone}`);
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
  
  // Log no início da função de renderização (usando info)
  logger.info('Videos component rendering...', { loading, videosLength: videos.length });
  
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
            // Log do estado no momento da renderização pós-loading (usando info)
            logger.info('Renderizando após loading', { videosLength: videos.length });

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
                        {categoryVideos.map(video => {
                          // Log da URL da thumbnail (usando info)
                          logger.info(`Renderizando thumbnail para vídeo ID ${video.id}`, { thumbnailUrl: video.r2ThumbnailKey });
                          return (
                            <Card 
                              key={video.id}
                              className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
                              onClick={() => handleVideoClick(video.id)}
                              onMouseEnter={() => setHoveredVideo(video.id)}
                              onMouseLeave={() => setHoveredVideo(null)}
                            >
                              <div className="relative aspect-video">
                                <VideoThumbnail
                                  thumbnailKey={video.r2ThumbnailKey}
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
                        })}
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
