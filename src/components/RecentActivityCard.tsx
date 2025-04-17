import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, AlertTriangle, Film, Clock, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getSecureR2Url } from '@/services/videoService';
import { Skeleton } from "@/components/ui/skeleton";

interface Video {
  id: string;
  title: string;
  thumbnailR2Key?: string;
  r2ThumbnailKey?: string;
  views: number;
  duration: number;
  category: string;
}

interface Incident {
  id: string;
  title: string;
  severity: "Baixo" | "Médio" | "Alto";
  status: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  date: Date;
}

interface ActivityCardProps {
  videos: Video[];
  incidents?: Incident[];
  className?: string;
}

// Componente para exibir a miniatura do vídeo
const VideoThumbnail = ({ video }: { video: Video }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadThumbnail = async () => {
      setIsLoading(true);
      setError(false);
      setErrorMessage(null);
      
      const thumbnailKey = video.thumbnailR2Key || video.r2ThumbnailKey;
      
      if (!thumbnailKey) {
        setError(true);
        setErrorMessage('Chave de miniatura não definida');
        setIsLoading(false);
        return;
      }
      
      try {
        const url = await getSecureR2Url(thumbnailKey);
        
        if (!url) {
          setError(true);
          setErrorMessage('URL segura vazia');
          setIsLoading(false);
          return;
        }
        
        setThumbnailUrl(url);
      } catch (err) {
        setError(true);
        setErrorMessage(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThumbnail();
  }, [video]);

  if (isLoading) {
    return <Skeleton className="w-full h-full" />;
  }

  if (error || !thumbnailUrl) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200">
        <Film className="w-5 h-5 text-gray-400" />
        {errorMessage && (
          <span className="text-xs text-gray-500 mt-1 px-1 truncate max-w-full">
            Erro: {errorMessage.substring(0, 20)}
          </span>
        )}
      </div>
    );
  }

  return (
    <img 
      src={thumbnailUrl} 
      alt={video.title}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={(e) => {
        setError(true);
        setErrorMessage('Erro ao carregar imagem');
      }}
    />
  );
};

export const RecentActivityCard = ({ videos, incidents = [], className = "" }: ActivityCardProps) => {
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
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Atividade Recente</CardTitle>
          <div className="flex space-x-1">
            <Button 
              variant={activeTab === "videos" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("videos")}
              className={activeTab === "videos" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
            >
              <Film className="w-4 h-4 mr-1" /> Vídeos
            </Button>
            <Button 
              variant={activeTab === "quaseAcidentes" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("quaseAcidentes")}
              className={activeTab === "quaseAcidentes" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
            >
              <AlertTriangle className="w-4 h-4 mr-1" /> Quase Acidentes
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeTab === "videos" ? (
          <div className="space-y-3">
            {videos.map((video) => (
              <div 
                key={video.id} 
                className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleVideoClick(video.id)}
              >
                <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden mr-3 relative">
                  <VideoThumbnail video={video} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">{video.title}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Eye className="w-3 h-3 mr-1" /> {video.views} visualizações
                    <Clock className="w-3 h-3 ml-2 mr-1" /> {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')} min
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {video.category}
                  </span>
                </div>
              </div>
            ))}
            
            {videos.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Não existem vídeos visualizados recentemente.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.length > 0 ? incidents.map((incident) => (
              <div 
                key={incident.id} 
                className={`flex items-center p-3 border-l-4 rounded-lg hover:bg-opacity-90 cursor-pointer ${getSeverityColor(incident.severity)}`}
                onClick={() => handleIncidentClick(incident.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{incident.title}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <AlertTriangle className={`w-3 h-3 mr-1 ${
                      incident.severity === "Alto" 
                        ? "text-red-500" 
                        : incident.severity === "Médio"
                        ? "text-orange-500"
                        : "text-yellow-500"
                    }`} /> 
                    Gravidade: {incident.severity} • Estado: {incident.status}
                    <Calendar className="w-3 h-3 ml-2 mr-1" /> {formatDate(incident.date)}
                  </div>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500">
                <p>Não existem quase acidentes reportados recentemente.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard; 