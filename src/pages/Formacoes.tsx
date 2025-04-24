import { useState, useEffect, Suspense } from 'react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Factory3DModelManager, { FactoryZone } from "@/components/Factory3DModelManager";
import VideosCategoryCard from '@/components/VideosCategoryCard';
import { useIsCompactView } from '@/hooks/use-mobile';
import { getZoneStats, ZoneStats } from '@/services/zoneStatsService';
import { Progress } from "@/components/ui/progress";
import { uploadVideo, getVideos } from '@/services/videoService';
import { Video } from '@/types';
import { ErrorBoundary } from 'react-error-boundary';

const factoryZones = [
  { zone: 'Enchimento', color: '#3B82F6' },
  { zone: 'Fabrico', color: '#10B981' },
  { zone: 'Robbialac', color: '#EF4444' },
  { zone: 'MateriaPrima', color: '#F59E0B' },
  { zone: 'Expedicao', color: '#8B5CF6' },
  { zone: 'TrafegoInferior', color: '#EC4899' },
  { zone: 'TrafegoSuperior', color: '#06B6D4' }
];

export default function Formacoes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useSimpleView, setUseSimpleView] = useState(false);
  const [enableControls, setEnableControls] = useState(true);
  const isCompactView = useIsCompactView();
  const [zoneStats, setZoneStats] = useState<ZoneStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    category: '',
    zone: '',
    file: null as File | null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [categoryVideos, setCategoryVideos] = useState<Record<string, Video[]>>({});
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin_app');
  }, [user]);
  
  useEffect(() => {
    const fetchZoneStats = async () => {
      try {
        setIsLoading(true);
        const data = await getZoneStats();
        setZoneStats(data);
      } catch (error) {
        toast.error("Erro ao carregar estatísticas. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchZoneStats();
  }, []);
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const allVideos = await getVideos();
        const videosByCategory = allVideos.reduce((acc, video) => {
          if (!acc[video.category]) {
            acc[video.category] = [];
          }
          acc[video.category].push(video);
          return acc;
        }, {} as Record<string, Video[]>);
        
        setCategoryVideos(videosByCategory);
      } catch (error) {
        toast.error("Erro ao carregar vídeos");
      }
    };

    fetchVideos();
  }, []);
  
  const handleZoneClick = (zone: string) => {
    navigate(`/videos/${zone.toLowerCase()}`);
  };
  
  const showImportModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVideoData({ ...videoData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho do arquivo (500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB em bytes
    if (file.size > maxSize) {
      toast.error('O arquivo é muito grande. O tamanho máximo permitido é 500MB.');
      e.target.value = ''; // Limpa o input
      return;
    }

    // Validar tipo do arquivo
    const validTypes = ['video/mp4', 'video/x-m4v', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato de arquivo inválido. Por favor, use MP4, MOV ou AVI.');
      e.target.value = '';
      return;
    }

    setVideoData(prev => ({ ...prev, file }));
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validações do formulário
      if (!videoData.title.trim()) {
        toast.error('Por favor, insira um título para o vídeo.');
        return;
      }
      if (!videoData.description.trim()) {
        toast.error('Por favor, insira uma descrição para o vídeo.');
        return;
      }
      if (!videoData.category) {
        toast.error('Por favor, selecione uma categoria.');
        return;
      }
      if (!videoData.zone) {
        toast.error('Por favor, selecione uma zona da fábrica.');
        return;
      }
      if (!videoData.file) {
        toast.error('Por favor, selecione um arquivo de vídeo.');
        return;
      }

      setIsUploading(true);
      setUploadStatus('Preparando upload...');
      setUploadProgress(0);

      const result = await uploadVideo(
        videoData.file,
        {
          title: videoData.title.trim(),
          description: videoData.description.trim(),
          category: videoData.category,
          zone: videoData.zone
        },
        (progress) => {
          setUploadProgress(progress.percentage);
          setUploadStatus(progress.status === 'uploading' 
            ? `Enviando parte ${progress.currentChunk} de ${progress.totalChunks}...`
            : progress.status === 'processing'
            ? 'Processando vídeo...'
            : 'Concluindo upload...'
          );
        }
      );

      if (result.success) {
        toast.success('Vídeo enviado com sucesso!');
        setIsModalOpen(false);
        // Atualizar a lista de vídeos se necessário
        // fetchVideos();
      } else {
        throw new Error(result.error || 'Erro ao enviar o vídeo');
      }
    } catch (error) {
      let errorMessage = 'Ocorreu um erro ao enviar o vídeo.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('network')) {
          errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'O upload demorou muito tempo. Tente novamente.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadStatus('');
      setUploadProgress(0);
      // Limpar o formulário
      setVideoData({
        title: '',
        description: '',
        category: '',
        zone: '',
        file: null
      });
    }
  };

  const handleToggleView = () => {
    setUseSimpleView(!useSimpleView);
  };

  const handleToggleControls = () => {
    // Esta função pode ser removida se não houver mais botão para ela
    // setEnableControls(!enableControls);
  };

  const videoCategories = [
    { 
      title: "Segurança", 
      displayTitle: "Segurança",
      description: "Vídeos sobre protocolos de segurança, EPIs e procedimentos de emergência."
    },
    { 
      title: "Qualidade", 
      displayTitle: "Qualidade",
      description: "Vídeos sobre controle de qualidade, testes e garantia de qualidade."
    },
    { 
      title: "Procedimentos e Regras", 
      displayTitle: "Procedimentos e Regras",
      description: "Vídeos sobre normas da empresa, processos e boas práticas."
    }
  ];
  
  const categoriesSection = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {videoCategories.map((category) => (
        <VideosCategoryCard 
          key={category.title}
          category={category.title} 
          displayTitle={category.displayTitle}
          description={category.description}
          videos={categoryVideos[category.title] || []}
          count={(categoryVideos[category.title] || []).length}
          color={
            category.title === 'Segurança' ? '#FF4444' :
            category.title === 'Qualidade' ? '#4444FF' :
            '#44AA44' // Procedimentos e Regras
          }
        />
      ))}
    </div>
  );
  
  return (
    <Layout>
      <div className="p-4 flex flex-col h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-2xl font-bold">Formações</h1>
          <div className="flex space-x-2">
            {isAdmin && (
              <Button onClick={showImportModal} variant="default">Importar Vídeo</Button>
            )}
            <Button onClick={() => navigate('/videos/lista')} variant="outline">Ver Lista</Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
          <Card className="border flex-1 min-h-0 flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Mapa da Fábrica</CardTitle>
              <CardDescription>Selecione uma área da fábrica para ver os vídeos relacionados</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2 relative overflow-hidden">
              <ErrorBoundary fallback={<div className="text-red-500">Erro ao carregar o modelo 3D.</div>}>
                <Suspense fallback={<div className="flex items-center justify-center h-full">Carregando modelo 3D...</div>}>
                  <Factory3DModelManager 
                    onZoneClick={handleZoneClick} 
                    enableControls={enableControls}
                  />
                </Suspense>
              </ErrorBoundary>
              <p className="text-sm text-muted-foreground text-center mt-2 absolute bottom-2 left-1/2 transform -translate-x-1/2">
                Interaja com o modelo 3D para explorar as diferentes áreas da fábrica
              </p>
            </CardContent>
          </Card>

          <div className="flex-shrink-0">
            {categoriesSection}
          </div>
        </div>
        
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Importar Novo Vídeo</h2>
              </div>
              
              <form onSubmit={handleVideoUpload} className="p-4 space-y-4">
                <div>
                  <label htmlFor="videoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Vídeo
                  </label>
                  <input
                    type="text"
                    id="videoTitle"
                    name="title"
                    value={videoData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    placeholder="Ex: Procedimentos de Segurança"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="videoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    id="videoDescription"
                    name="description"
                    value={videoData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder="Descreva o conteúdo do vídeo"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="videoCategory" className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    id="videoCategory"
                    name="category"
                    value={videoData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    required
                    autoComplete="off"
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Qualidade">Qualidade</option>
                    <option value="Procedimentos e Regras">Procedimentos e Regras</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="videoZone" className="block text-sm font-medium text-gray-700 mb-1">
                    Zona da Fábrica
                  </label>
                  <select
                    id="videoZone"
                    name="zone"
                    value={videoData.zone}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    required
                    autoComplete="off"
                  >
                    <option value="">Selecione uma zona</option>
                    {factoryZones.map((zone) => (
                      <option key={zone.zone} value={zone.zone}>
                        {zone.zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="videoFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo de Vídeo
                  </label>
                  <input
                    type="file"
                    id="videoFile"
                    name="video"
                    onChange={handleFileChange}
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                    className="w-full border rounded-md p-2"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Formatos aceitos: MP4, MOV, AVI, MKV (máx. 500MB)
                  </p>
                </div>

                {isUploading && (
                  <div>
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-gray-500 mt-1">
                      {uploadProgress}% - {uploadStatus}
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={isUploading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Enviando...' : 'Enviar Vídeo'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
