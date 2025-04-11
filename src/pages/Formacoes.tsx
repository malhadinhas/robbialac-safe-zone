
import { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { mockStatsByZone } from "@/services/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Factory3DModelManager from "@/components/Factory3DModelManager";
import VideosCategoryCard from '@/components/VideosCategoryCard';
import { NoScrollLayout } from '@/components/NoScrollLayout';
import { useIsCompactView } from '@/hooks/use-mobile';

export default function Formacoes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [useSimpleView, setUseSimpleView] = useState(false);
  const isCompactView = useIsCompactView();
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin_app');
  }, [user]);
  
  // Função para navegar para os vídeos de uma zona específica
  const handleZoneClick = (zone: string) => {
    navigate(`/videos/${zone.toLowerCase()}`);
  };
  
  const showImportModal = () => {
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
  };
  
  const handleVideoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Vídeo enviado com sucesso para Cloudflare R2!");
    setIsModalOpen(false);
  };

  const handleToggleView = () => {
    setUseSimpleView(!useSimpleView);
  };

  // Video categories data
  const videoCategories = [
    { 
      title: "Segurança", 
      description: "Vídeos sobre protocolos de segurança, EPIs e procedimentos de emergência."
    },
    { 
      title: "Qualidade", 
      description: "Vídeos sobre controle de qualidade, inspeções e padrões de produção."
    },
    { 
      title: "Procedimentos e Regras", 
      description: "Vídeos sobre normas da empresa, processos e boas práticas."
    }
  ];
  
  // Define sections for the no-scroll layout
  const mainSection = (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Formações</h1>
        <p className="text-gray-600">Selecione uma área da fábrica para ver os vídeos disponíveis</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        {isAdmin && (
          <Button onClick={showImportModal} className="bg-robbialac hover:bg-robbialac-dark">
            Importar Vídeo
          </Button>
        )}

        <Button onClick={handleToggleView} variant="outline">
          {useSimpleView ? "Ver Modelo 3D" : "Ver Lista Simples"}
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Mapa da Fábrica</CardTitle>
          <CardDescription>Selecione uma área para ver os vídeos relacionados</CardDescription>
        </CardHeader>
        <CardContent>
          {useSimpleView ? (
            <>
              {/* Visão simplificada por botões */}
              <div className="aspect-video bg-gray-100 rounded-md flex flex-col items-center justify-center p-8">
                <div className="text-gray-500 mb-8 text-center">
                  <p className="mb-4">Visualização simplificada por botões.</p>
                  <p>Selecione uma das áreas abaixo:</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl w-full">
                  {mockStatsByZone.map((zone) => (
                    <Button
                      key={zone.zone}
                      onClick={() => handleZoneClick(zone.zone)}
                      className="h-24 text-lg"
                      style={{ backgroundColor: zone.color }}
                    >
                      Área de {zone.zone}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Visualização 3D da fábrica - usando o novo componente */}
              <Factory3DModelManager onZoneClick={handleZoneClick} />
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
          description={category.description}
        />
      ))}
    </div>
  );
  
  const pageContent = isCompactView 
    ? <NoScrollLayout sections={[mainSection, categoriesSection]} />
    : (
        <>
          {mainSection}
          {categoriesSection}
        </>
      );
  
  return (
    <Layout>
      {pageContent}
      
      {/* Modal de Upload - manter como está */}
      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Importar Novo Vídeo</h2>
              </div>
              
              <form onSubmit={handleVideoUpload}>
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Vídeo
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded-md p-2"
                      placeholder="Ex: Procedimentos de Segurança"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arquivo de Vídeo
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      className="w-full border rounded-md p-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Zona da Fábrica
                    </label>
                    <select className="w-full border rounded-md p-2" required>
                      <option value="">Selecione...</option>
                      <option value="enchimento">Enchimento</option>
                      <option value="fabrico">Fabrico</option>
                      <option value="outra">Outra</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <select className="w-full border rounded-md p-2" required>
                      <option value="">Selecione...</option>
                      <option value="seguranca">Segurança</option>
                      <option value="qualidade">Qualidade</option>
                      <option value="procedimentos">Procedimentos e Regras</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      className="w-full border rounded-md p-2"
                      rows={3}
                      placeholder="Descreva brevemente o conteúdo do vídeo"
                    ></textarea>
                  </div>
                </div>
                
                <div className="p-4 border-t bg-gray-50 flex justify-end space-x-2 rounded-b-lg">
                  <Button variant="outline" type="button" onClick={closeModal}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-robbialac hover:bg-robbialac-dark">
                    Importar
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
