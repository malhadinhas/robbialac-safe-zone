
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { mockVideos } from "@/services/mockData";
import { Video } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize, 
  SkipBack, 
  SkipForward, 
  Share2
} from "lucide-react";

export default function VideosVisualizar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  useEffect(() => {
    if (id) {
      const foundVideo = mockVideos.find(v => v.id === id);
      if (foundVideo) {
        setVideo(foundVideo);
        setDuration(foundVideo.duration);
        
        // Simular que o usuário assistiu ao vídeo após carregar
        const timer = setTimeout(() => {
          if (user && !user.viewedVideos.includes(id)) {
            // Adicionar pontos pela visualização
            toast.success(`+${foundVideo.pointsForWatching} pontos por assistir este vídeo!`);
          }
        }, 3000);
        
        return () => clearTimeout(timer);
      } else {
        toast.error("Vídeo não encontrado!");
        navigate("/formacoes");
      }
    }
  }, [id, navigate, user]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && progress < 100) {
      interval = setInterval(() => {
        const newProgress = progress + (100 / (duration || 1)) * 0.5;
        const newTime = currentTime + 0.5;
        
        setProgress(Math.min(newProgress, 100));
        setCurrentTime(Math.min(newTime, duration));
        
        if (newProgress >= 100) {
          setIsPlaying(false);
        }
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, progress, duration, currentTime]);
  
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    const newTime = (duration * newProgress) / 100;
    
    setProgress(newProgress);
    setCurrentTime(newTime);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Link copiado para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar o link!"));
  };
  
  return (
    <Layout>
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={handleGoBack} className="mr-2">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold flex-1">{video?.title}</h1>
      </div>
      
      <div className="bg-black relative rounded-lg overflow-hidden aspect-video max-h-[70vh]">
        {/* Placeholder para o vídeo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src={video?.thumbnail || "/placeholder.svg"} 
            alt={video?.title} 
            className="w-full h-full object-contain"
          />
        </div>
        
        {/* Overlay de controles */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          {/* Barra de progresso */}
          <div className="pb-2">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleProgressChange}
              className="cursor-pointer"
            />
          </div>
          
          {/* Controles de reprodução */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handlePlayPause}>
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <span className="text-xs">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleMute}>
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Informações do vídeo */}
      <div className="mt-6">
        <h2 className="text-2xl font-bold mb-2">{video?.title}</h2>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="bg-robbialac text-white px-2 py-1 rounded-full text-xs mr-2">
            {video?.category}
          </span>
          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs mr-2">
            {video?.zone}
          </span>
          <span>{video?.views} visualizações</span>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Descrição</h3>
          <p className="text-gray-700">{video?.description}</p>
        </div>
        
        <div className="mt-4">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Progresso: {Math.round(progress)}%</span>
            {progress === 100 && <span className="text-green-600 font-medium">Concluído</span>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
