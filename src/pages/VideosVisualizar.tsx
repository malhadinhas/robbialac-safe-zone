import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Share2
} from "lucide-react";
import { getVideoById, getSecureR2Url } from "@/services/videoService";
import { awardVideoPoints } from "@/services/pointService";
import ReactPlayer from 'react-player';
import { Skeleton } from "@/components/ui/skeleton";

interface ReactPlayerProgressState {
  played: number;          // 0 to 1
  playedSeconds: number;
  loaded: number;          // 0 to 1
  loadedSeconds: number;
}

export default function VideosVisualizar() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [video, setVideo] = useState<Video | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoadingUrls, setIsLoadingUrls] = useState<boolean>(true);
  const [errorLoadingUrls, setErrorLoadingUrls] = useState<string | null>(null);
  const [hasAwardedPoints, setHasAwardedPoints] = useState<boolean>(false);
  
  useEffect(() => {
    let isMounted = true;
    const fetchVideoAndUrls = async () => {
      if (!id) {
        setErrorLoadingUrls("ID do vídeo não encontrado no URL.");
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
              secureStreamUrl = await getSecureR2Url(foundVideo.r2VideoKey);
            } catch (streamErr) {
              console.error('Falha ao buscar URL segura para o stream', { videoId: id, key: foundVideo.r2VideoKey, error: streamErr });
              setErrorLoadingUrls('Falha ao carregar URL do vídeo.');
            }
          } else {
              console.warn('Chave R2 principal (r2VideoKey) não encontrada para o vídeo', { videoId: id });
              if (!errorLoadingUrls) setErrorLoadingUrls('Falha ao carregar URL do vídeo: Chave não encontrada.');
          }

          if (foundVideo.r2ThumbnailKey) {
             try {
              secureThumbnailUrl = await getSecureR2Url(foundVideo.r2ThumbnailKey);
            } catch (thumbErr) {
              console.error('Falha ao buscar URL segura para a thumbnail', { videoId: id, key: foundVideo.r2ThumbnailKey, error: thumbErr });
              if (!errorLoadingUrls) {
                 setErrorLoadingUrls('Falha ao carregar URL da miniatura.');
              }
            }
          } else {
             console.warn('Chave R2 da thumbnail (r2ThumbnailKey) não encontrada para o vídeo', { videoId: id });
             if (!errorLoadingUrls) setErrorLoadingUrls('Falha ao carregar URL da miniatura: Chave não encontrada.');
          }
          
          if (isMounted) {
            setStreamUrl(secureStreamUrl);
            setThumbnailUrl(secureThumbnailUrl);
          }

        } else {
           console.warn(`Vídeo ${id} não está pronto (status: ${foundVideo.status}). URLs assinadas não serão buscadas.`);
           setErrorLoadingUrls(`O vídeo ainda está a ser processado (estado: ${foundVideo.status}).`);
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
  
  const handleReactPlayerProgress = (state: ReactPlayerProgressState) => {
    setProgressPercent(state.played * 100);
  };
  
  const handleVideoEnded = async () => {
    setProgressPercent(100);
    
    if (!hasAwardedPoints && user?.id && video?._id) { 
      console.log(`Tentando atribuir pontos para vídeo ${video._id} ao user ${user.id}`);
      try {
        await awardVideoPoints(video._id, user.id);
        toast.success("Pontos obtidos pela visualização do vídeo!");
        setHasAwardedPoints(true);
      } catch (error) {
        console.error("Erro ao atribuir pontos pela visualização do vídeo:", error);
      }
    }
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success("Ligação copiada para a área de transferência!"))
      .catch(() => toast.error("Erro ao copiar a ligação!"));
  };
  
  const duration = video?.duration || 0;

  return (
    <Layout>
      <div className="bg-[#f7faff] min-h-screen py-6 flex flex-col items-center justify-start">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center mb-6 px-2 sm:px-0">
            <Button 
              variant="default"
              className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg mr-4"
              onClick={handleGoBack}
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
          </Button>
            <h1 className="text-2xl font-semibold text-gray-900">{video?.title || 'A carregar vídeo...'}</h1>
        </div>
          <div className="bg-black relative rounded-2xl overflow-hidden aspect-video max-h-[60vh] shadow-xl border border-gray-100">
          {isLoadingUrls ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-robbialac"></div>
            </div>
          ) : errorLoadingUrls ? (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
               <p>Erro ao carregar vídeo: {errorLoadingUrls}</p>
             </div>
          ) : streamUrl ? (
            <ReactPlayer 
              url={streamUrl}
              controls={true}
              playing
              onProgress={handleReactPlayerProgress}
              onEnded={handleVideoEnded}
              width='100%'
              height='100%'
              config={{ 
                file: { 
                  attributes: { 
                    poster: thumbnailUrl || undefined 
                  }
                }
              }}
            />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white p-4">
               <p>Não foi possível obter a URL do vídeo.</p>
             </div>
          )}
        </div>
          <div className="mt-6 bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {video?.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                  {video.category}
                </span>
              )}
              {video?.zone && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                  {video.zone}
                </span>
              )}
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Descrição</h2>
          <p className="text-gray-700 mb-6 whitespace-pre-line">
            {video?.description || 'Descrição não disponível.'}
          </p>
          <h3 className="text-md font-medium mb-2">Progresso</h3>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{Math.round(duration * (progressPercent / 100))}s</span>
            <span>{Math.round(duration)}s</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

