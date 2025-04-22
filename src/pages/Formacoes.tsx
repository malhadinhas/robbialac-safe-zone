import { useState, useEffect, Suspense } from 'react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Factory3DModelManager, { FactoryZone } from "@/components/Factory3DModelManager";
import VideosCategoryCard from '@/components/VideosCategoryCard';
import { NoScrollLayout } from '@/components/NoScrollLayout';
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
  
  const mainSection = (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Formações</h1>
        <p className="text-gray-600">Selecione uma área da fábrica para ver os vídeos disponíveis</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          {isAdmin && (
            <Button onClick={showImportModal} className="bg-robbialac hover:bg-robbialac-dark">
              Importar Vídeo
            </Button>
          )}
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleToggleView} variant="outline">
            {useSimpleView ? "Ver Modelo 3D" : "Ver Lista Simples"}
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mapa da Fábrica</CardTitle>
          <CardDescription>Selecione uma área para ver os vídeos relacionados</CardDescription>
        </CardHeader>
        <CardContent>
          {useSimpleView ? (
            <>
              <div className="flex flex-col items-center p-2 sm:p-4">
                <h2 className="text-sm mb-2 text-gray-600">Selecione uma das áreas abaixo:</h2>
                <div className="w-full max-w-md space-y-2">
                  <button
                    onClick={() => handleZoneClick('Enchimento')}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de Enchimento
                  </button>
                  <button
                    onClick={() => handleZoneClick('Fabrico')}
                    className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de Fabrico
                  </button>
                  <button
                    onClick={() => handleZoneClick('Robbialac')}
                    className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de Robbialac
                  </button>
                  <button
                    onClick={() => handleZoneClick('MateriaPrima')}
                    className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de MateriaPrima
                  </button>
                  <button
                    onClick={() => handleZoneClick('Expedicao')}
                    className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de Expedicao
                  </button>
                  <button
                    onClick={() => handleZoneClick('TrafegoInferior')}
                    className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de TrafegoInferior
                  </button>
                  <button
                    onClick={() => handleZoneClick('TrafegoSuperior')}
                    className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Área de TrafegoSuperior
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Factory3DModelManager 
                onZoneClick={handleZoneClick} 
              />
              <p className="text-sm text-gray-500 mt-2 text-center">
                Interaja com o modelo 3D para explorar as diferentes áreas da fábrica
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
  
  const categoriesSection = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
  
  const pageContent = isCompactView 
    ? <NoScrollLayout sections={[mainSection]} />
    : (
        <>
          {mainSection}
          {categoriesSection}
        </>
      );
  
  return (
    <Layout>
      <div className="h-screen w-full overflow-hidden">
        {/* Header (20% do espaço) */}
        <div className="h-[20%] p-2 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h1 className="text-lg sm:text-3xl font-bold text-gray-800 line-clamp-1">Formações</h1>
              <p className="text-xs sm:text-base text-gray-600 line-clamp-2">Selecione uma área da fábrica para ver os vídeos disponíveis</p>
            </div>
            <div className="flex gap-1 mt-1 sm:mt-0">
              {isAdmin && (
                <Button 
                  onClick={showImportModal}
                  className="h-8 text-xs px-2"
                >
                  Importar Vídeo
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={handleToggleView}
                className="h-8 text-xs px-2"
              >
                {useSimpleView ? "Ver Modelo 3D" : "Ver Lista Simples"}
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <h2 className="text-base font-semibold line-clamp-1">Mapa da Fábrica</h2>
            <p className="text-xs text-gray-600 line-clamp-1">Selecione uma área para ver os vídeos relacionados</p>
          </div>
        </div>

        {/* Container do modelo 3D ou Lista Simples (70% do espaço) */}
        <div className="h-[70%] px-2">
          {useSimpleView ? (
            // Lista Simples (copiada da definição de mainSection)
            <div className="h-full w-full flex flex-col items-center justify-center p-2 sm:p-4 bg-gray-100 rounded-lg overflow-y-auto">
              <h2 className="text-sm mb-2 text-gray-600">Selecione uma das áreas abaixo:</h2>
              <div className="w-full max-w-md space-y-2">
                <button
                  onClick={() => handleZoneClick('Enchimento')}
                  className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de Enchimento
                </button>
                <button
                  onClick={() => handleZoneClick('Fabrico')}
                  className="w-full py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de Fabrico
                </button>
                <button
                  onClick={() => handleZoneClick('Robbialac')}
                  className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de Robbialac
                </button>
                <button
                  onClick={() => handleZoneClick('MateriaPrima')}
                  className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de MateriaPrima
                </button>
                <button
                  onClick={() => handleZoneClick('Expedicao')}
                  className="w-full py-2 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de Expedicao
                </button>
                <button
                  onClick={() => handleZoneClick('TrafegoInferior')}
                  className="w-full py-2 px-4 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de TrafegoInferior
                </button>
                <button
                  onClick={() => handleZoneClick('TrafegoSuperior')}
                  className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors text-sm"
                >
                  Área de TrafegoSuperior
                </button>
              </div>
            </div>
          ) : (
            // Modelo 3D
            <ErrorBoundary fallback={<div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-lg">
              <p className="text-sm text-gray-600">Erro ao carregar o modelo 3D. Tente recarregar a página.</p>
            </div>}>
              <div className="h-full w-full bg-gray-100 rounded-lg overflow-hidden">
                <Suspense fallback={
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-robbialac"></div>
                  </div>
                }>
                  <Factory3DModelManager
                    onZoneClick={handleZoneClick}
                    useSimpleView={useSimpleView}
                    enableControls={enableControls}
                    zoneStats={zoneStats}
                    isLoading={isLoading}
                    className="h-full w-full"
                  />
                </Suspense>
              </div>
            </ErrorBoundary>
          )}
        </div>

        {/* Espaço restante (10%) */}
        <div className="h-[10%]"></div>
      </div>
      
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Importar Novo Vídeo</h2>
              </div>
              
              <form onSubmit={handleVideoUpload} className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título do Vídeo
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={videoData.title}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    placeholder="Ex: Procedimentos de Segurança"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={videoData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder="Descreva o conteúdo do vídeo"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    name="category"
                    value={videoData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Qualidade">Qualidade</option>
                    <option value="Procedimentos e Regras">Procedimentos e Regras</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zona da Fábrica
                  </label>
                  <select
                    name="zone"
                    value={videoData.zone}
                    onChange={handleInputChange}
                    className="w-full border rounded-md p-2"
                    required
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arquivo de Vídeo
                  </label>
                  <input
                    type="file"
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
        </>
      )}
    </Layout>
  );
}
