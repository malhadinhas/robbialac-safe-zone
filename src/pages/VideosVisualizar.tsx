import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
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
import { getVideoById, getSecureR2Url, incrementVideoViews } from "@/services/videoService";
import VideoPlayer from "@/components/video/HLSVideoPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/utils/logger";
import { formatDuration, formatTime } from "@/utils/formatters";

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
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState<boolean>(true);
  const [errorLoadingUrls, setErrorLoadingUrls] = useState<string | null>(null);
  const videoControlsRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    let isMounted = true;
    const fetchVideoAndUrls = async () => {
      if (!id) {
        setErrorLoadingUrls("ID do vídeo não encontrado na URL.");
        setIsLoadingUrls(false);
        return;
      }
      
      setIsLoadingUrls(true);
      setErrorLoadingUrls(null);
      setVideo(null);
      setStreamUrl(null);
      setThumbnailUrl(null);
      
      try {
        const foundVideo = await getVideoById(id);
        if (!foundVideo) {
          toast.error("Vídeo não encontrado!");
          navigate("/formacoes");
          return;
        }
        if (isMounted) {
          setVideo(foundVideo);
        }

        if (foundVideo.status === 'ready') {
          let secureStreamUrl: string | null = null;
          let secureThumbnailUrl: string | null = null;

          if (foundVideo.r2VideoKey) {
            try {
              logger.info('Solicitando URL segura para o vídeo principal', { key: foundVideo.r2VideoKey });
              secureStreamUrl = await getSecureR2Url(foundVideo.r2VideoKey);
              logger.info('URL segura recebida para o vídeo principal', { url: secureStreamUrl });
            } catch (streamErr) {
              logger.error('Falha ao buscar URL segura para o stream', { videoId: id, key: foundVideo.r2VideoKey, error: streamErr });
              setErrorLoadingUrls('Falha ao carregar URL do vídeo.');
            }
          } else {
              logger.warn('Chave R2 principal (r2VideoKey) não encontrada para o vídeo', { videoId: id });
              if (!errorLoadingUrls) setErrorLoadingUrls('Falha ao carregar URL do vídeo: Chave não encontrada.');
          }

          if (foundVideo.r2ThumbnailKey) {
             try {
              logger.info('Solicitando URL segura para a thumbnail', { key: foundVideo.r2ThumbnailKey });
              secureThumbnailUrl = await getSecureR2Url(foundVideo.r2ThumbnailKey);
              logger.info('URL segura recebida para a thumbnail', { url: secureThumbnailUrl });
            } catch (thumbErr) {
              logger.error('Falha ao buscar URL segura para a thumbnail', { videoId: id, key: foundVideo.r2ThumbnailKey, error: thumbErr });
              if (!errorLoadingUrls) {
                 setErrorLoadingUrls('Falha ao carregar URL da miniatura.');
              }
            }
          } else {
             logger.warn('Chave R2 da thumbnail (r2ThumbnailKey) não encontrada para o vídeo', { videoId: id });
             if (!errorLoadingUrls) setErrorLoadingUrls('Falha ao carregar URL da miniatura: Chave não encontrada.');
          }
          
          if (isMounted) {
            setStreamUrl(secureStreamUrl);
            setThumbnailUrl(secureThumbnailUrl);
          }

          if (!errorLoadingUrls) { 
            try {
               await incrementVideoViews(id);
            } catch (viewError) {
               logger.error('Falha ao incrementar visualizações', { videoId: id, error: viewError });
            }
          }

        } else {
           logger.warn(`Vídeo ${id} não está pronto (status: ${foundVideo.status}). URLs assinadas não serão buscadas.`);
           setErrorLoadingUrls(`O vídeo ainda está a ser processado (status: ${foundVideo.status}).`);
        }

      } catch (error) {
        toast.error("Erro ao carregar informações do vídeo.");
        if (isMounted) {
           setErrorLoadingUrls("Erro ao carregar informações do vídeo.");
        }
      } finally {
         if (isMounted) {
            setIsLoadingUrls(false);
         }
      }
    };
    
    fetchVideoAndUrls();

    return () => {
      isMounted = false;
    }
  }, [id, navigate]);
  
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
  
  const handleVideoProgress = (progressPercent: number, time: number) => {
    setProgress(progressPercent);
    setCurrentTime(time);
  };
  
  const handleVideoEnded = () => {
    setIsPlaying(false);
    setProgress(100);
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
  
  const duration = video?.duration || 0;

  return (
    <Layout>
      <div className="container max-w-6xl py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold">{video?.title || 'Carregando vídeo...'}</h1>
        </div>
        
        <div className="bg-black relative rounded-lg overflow-hidden aspect-video max-h-[70vh]">
          {isLoadingUrls ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-robbialac"></div>
            </div>
          ) : errorLoadingUrls ? (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
               <p>Erro ao carregar vídeo: {errorLoadingUrls}</p>
             </div>
          ) : streamUrl ? (
            <VideoPlayer 
              videoUrl={streamUrl}
              autoPlay={isPlaying}
              controls={false}
              muted={isMuted}
              startAt={currentTime}
              onProgress={handleVideoProgress}
              onEnd={handleVideoEnded}
              className="w-full h-full object-contain"
              thumbnail={thumbnailUrl || undefined}
            />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
               <p>Não foi possível obter a URL do vídeo.</p>
             </div>
          )}
          
          <div
            ref={videoControlsRef}
            className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-4"
          >
            <div className="pb-2">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="cursor-pointer"
              />
            </div>
            
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
        
        {video && (
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
        )}
      </div>
    </Layout>
  );
}

