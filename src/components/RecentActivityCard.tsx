import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock, Eye, AlertTriangle, Film, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSecureR2Url } from '@/services/videoService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

interface Video {
  id: string;
  title: string;
  duration: number;
  views: number;
  thumbnailR2Key?: string;
  r2ThumbnailKey?: string;
  createdAt: string;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  date?: string;
}

interface ActivityCardProps {
  title?: string;
  videos?: Video[];
  incidents?: Incident[];
  className?: string;
  hideHeader?: boolean;
}

const VideoThumbnail = ({ video }: { video: Video }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      const thumbnailKey = video.thumbnailR2Key || video.r2ThumbnailKey;
      if (thumbnailKey) {
        try {
          const url = await getSecureR2Url(thumbnailKey);
          setThumbnailUrl(url);
        } catch (error) {
          console.error('Erro ao carregar thumbnail:', error);
          setError(true);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadThumbnail();
  }, [video]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 animate-pulse" />
    );
  }

  if (error || !thumbnailUrl) {
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

function RecentActivityCard({ 
  title = "Atividade Recente",
  videos = [], 
  incidents = [], 
  className = "",
  hideHeader = false 
}: ActivityCardProps) {
  const [activeTab, setActiveTab] = useState<"videos" | "quaseAcidentes">(
    videos.length > 0 ? "videos" : "quaseAcidentes"
  );
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/visualizar/${videoId}`);
  };

  const handleIncidentClick = (incidentId: string) => {
    navigate(`/quase-acidentes/visualizar/${incidentId}`);
  };

  // Formatar data no formato brasileiro
  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    
    try {
      const parsedDate = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(parsedDate.getTime())) return '';
      
      return parsedDate.toLocaleDateString('pt-BR');
    } catch (e) {
      console.error('Erro ao formatar data:', e);
      return '';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Alto':
        return 'border-l-red-500 bg-red-50';
      case 'Médio':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-yellow-400 bg-yellow-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolvido':
        return 'bg-green-100 text-green-800';
      case 'Em Análise':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={`h-full ${className}`}>
      {!hideHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="p-2 sm:p-3">
        {!isMobile ? (
          <Tabs defaultValue={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="w-full mb-2 h-8">
              <TabsTrigger value="videos" className="text-xs">Vídeos</TabsTrigger>
              <TabsTrigger value="quaseAcidentes" className="text-xs">Quase Acidentes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="videos" className="mt-0">
              {videos.length > 0 ? (
                <div className="space-y-2">
                  {videos.map(video => (
                    <div 
                      key={video.id} 
                      className="group flex items-center p-2 hover:bg-gray-50 cursor-pointer transition-colors rounded-md border border-transparent hover:border-gray-200"
                      onClick={() => handleVideoClick(video.id)}
                    >
                      <div className="flex-shrink-0 w-14 h-10 bg-gray-100 rounded overflow-hidden mr-2 relative">
                        <VideoThumbnail video={video} />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Film className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-xs">{video.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                          <span className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            {video.views || 0}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs">
                  Nenhum vídeo recente
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="quaseAcidentes" className="mt-0">
              {incidents.length > 0 ? (
                <div className="space-y-2">
                  {incidents.map(incident => (
                    <div
                      key={incident.id}
                      onClick={() => handleIncidentClick(incident.id)}
                      className={`group flex items-center p-2 cursor-pointer transition-all rounded-md border-l-4 hover:translate-x-1 ${getSeverityColor(incident.severity)}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-gray-900 truncate text-xs">
                            {incident.title}
                          </p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(incident.status)}`}>
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(incident.date || incident.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 text-xs">
                  Nenhum quase acidente recente
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          incidents.length > 0 ? (
            <div className="space-y-2">
              {incidents.map(incident => (
                <div
                  key={incident.id}
                  onClick={() => handleIncidentClick(incident.id)}
                  className={`group flex items-center p-2 cursor-pointer transition-all rounded-md border-l-4 hover:translate-x-1 ${getSeverityColor(incident.severity)}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 truncate text-xs">
                        {incident.title}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(incident.date || incident.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500 text-xs">
              Nenhum quase acidente recente
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivityCard; 