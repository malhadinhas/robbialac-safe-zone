import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Clock, Eye, AlertTriangle, Film, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getSecureR2Url } from '@/services/videoService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface ActivityCardProps {
  title: string;
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
  title,
  videos = [], 
  incidents = [], 
  className = "",
  hideHeader = false 
}: ActivityCardProps) {
  const [activeTab, setActiveTab] = useState<"videos" | "quaseAcidentes">("videos");
  const navigate = useNavigate();

  const handleVideoClick = (videoId: string) => {
    navigate(`/videos/visualizar/${videoId}`);
  };

  const handleIncidentClick = (incidentId: string) => {
    navigate(`/quase-acidentes/visualizar/${incidentId}`);
  };

  // Formatar data no formato brasileiro
  const formatDate = (date: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg mb-2 sm:mb-0">Atividade Recente</CardTitle>
            <div className="flex w-full sm:w-auto gap-2">
              <Button 
                variant={activeTab === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("videos")}
                className={`flex-1 sm:flex-none justify-center ${activeTab === "videos" ? "bg-robbialac hover:bg-robbialac-dark" : ""}`}
              >
                <Film className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Vídeos</span>
              </Button>
              <Button 
                variant={activeTab === "quaseAcidentes" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("quaseAcidentes")}
                className={`flex-1 sm:flex-none justify-center ${activeTab === "quaseAcidentes" ? "bg-robbialac hover:bg-robbialac-dark" : ""}`}
              >
                <AlertTriangle className="w-4 h-4 sm:mr-1" />
                <span className="hidden sm:inline">Quase Acidentes</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-2 sm:p-4 h-[calc(100%-4rem)]">
        {activeTab === "videos" ? (
          <div className="h-full flex flex-col justify-center">
            {videos.length > 0 ? (
              <div 
                key={videos[0].id} 
                className="group flex items-center p-2 hover:bg-gray-50 cursor-pointer transition-colors rounded-md border border-transparent hover:border-gray-200"
                onClick={() => handleVideoClick(videos[0].id)}
              >
                <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded overflow-hidden mr-3 relative">
                  <VideoThumbnail video={videos[0]} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{videos[0].title}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center">
                      <Eye className="w-3 h-3 mr-1" />
                      {videos[0].views || 0}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.floor(videos[0].duration / 60)}:{(videos[0].duration % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum vídeo recente
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center">
            {incidents.length > 0 ? (
              <div
                key={incidents[0].id}
                onClick={() => handleIncidentClick(incidents[0].id)}
                className={`group flex items-center p-2 cursor-pointer transition-all rounded-md border-l-4 hover:translate-x-1 ${getSeverityColor(incidents[0].severity)}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900 truncate text-sm">
                      {incidents[0].title}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(incidents[0].status)}`}>
                      {incidents[0].status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {formatDate(incidents[0].date)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                Nenhum quase acidente recente
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivityCard; 