
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { useParams, useNavigate } from "react-router-dom";
import { mockVideos } from "@/services/mockData";
import { Video } from "@/types";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, ThumbsUp, MessageSquare, Share2, Bookmark, 
  Flag, Clock, MoreVertical, Eye 
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VideosVisualizar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (id) {
      // Simular carregamento do vídeo
      setIsLoading(true);
      setTimeout(() => {
        const foundVideo = mockVideos.find(video => video.id === id);
        setVideo(foundVideo || null);
        setIsLoading(false);
        
        if (foundVideo) {
          // Registrar visualização e pontos
          toast.success(`+${foundVideo.pointsForWatching} pontos por assistir este vídeo!`);
        }
      }, 1000);
    }
  }, [id]);
  
  const handleBackClick = () => {
    navigate(-1);
  };
  
  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? "Gostei removido" : "Você gostou deste vídeo!");
  };
  
  const toggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved 
      ? "Vídeo removido dos salvos" 
      : "Vídeo salvo para assistir mais tarde!"
    );
  };
  
  const shareVideo = () => {
    toast.success("Link do vídeo copiado para a área de transferência!");
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-pulse text-robbialac text-xl font-semibold">
            Carregando vídeo...
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!video) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl font-semibold mb-4">Vídeo não encontrado</p>
          <Button onClick={handleBackClick}>Voltar</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="mb-4">
        <Button variant="ghost" onClick={handleBackClick} className="mb-2">
          <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
        </Button>
      </div>
      
      {/* Player de Vídeo */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="mb-4">
              <Play className="h-16 w-16 mx-auto" />
            </div>
            <p>
              Video Player será integrado aqui.<br />
              (Placeholder - sem vídeo real)
            </p>
          </div>
        </div>
      </div>
      
      {/* Informações do vídeo */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
        <div className="flex items-center justify-between flex-wrap gap-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Eye className="h-4 w-4 mr-1" /> {video.views} visualizações
            </span>
            <span>
              {formatDistanceToNow(new Date(video.uploadDate), { 
                addSuffix: true, 
                locale: ptBR 
              })}
            </span>
          </div>
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {video.category}
            </span>
          </div>
        </div>
        
        {/* Ações do vídeo */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          <Button 
            variant={isLiked ? "default" : "outline"} 
            size="sm"
            onClick={toggleLike}
            className={isLiked ? "bg-robbialac hover:bg-robbialac-dark" : ""}
          >
            <ThumbsUp className="h-4 w-4 mr-2" /> Gostei
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" /> Comentar
          </Button>
          <Button variant="outline" size="sm" onClick={shareVideo}>
            <Share2 className="h-4 w-4 mr-2" /> Compartilhar
          </Button>
          <Button 
            variant={isSaved ? "default" : "outline"} 
            size="sm"
            onClick={toggleSave}
            className={isSaved ? "bg-robbialac hover:bg-robbialac-dark" : ""}
          >
            <Bookmark className="h-4 w-4 mr-2" /> Salvar
          </Button>
          <Button variant="outline" size="sm" className="ml-auto">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Descrição */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Descrição</h3>
          <p className="text-gray-700 mb-4">{video.description}</p>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <div>
              <span className="font-medium">Área:</span> {video.zone}
            </div>
            <div>
              <span className="font-medium">Categoria:</span> {video.category}
            </div>
            <div>
              <span className="font-medium">Duração:</span> {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
            </div>
            <div>
              <span className="font-medium">Pontos:</span> +{video.pointsForWatching}
            </div>
          </div>
        </div>
      </div>
      
      {/* Seção de Vídeos Relacionados */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Vídeos Relacionados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockVideos
            .filter(v => v.id !== video.id && v.zone === video.zone)
            .slice(0, 3)
            .map(relatedVideo => (
              <div 
                key={relatedVideo.id}
                className="flex flex-col cursor-pointer hover:bg-gray-50 rounded-lg overflow-hidden"
                onClick={() => navigate(`/videos/visualizar/${relatedVideo.id}`)}
              >
                <div className="relative aspect-video bg-gray-200">
                  <img 
                    src={relatedVideo.thumbnail}
                    alt={relatedVideo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {Math.floor(relatedVideo.duration / 60)}:{(relatedVideo.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="p-2">
                  <h3 className="font-medium line-clamp-2 text-sm">{relatedVideo.title}</h3>
                  <div className="text-xs text-gray-500">
                    {relatedVideo.views} visualizações
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </Layout>
  );
}
