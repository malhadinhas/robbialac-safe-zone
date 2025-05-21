import { useState, useEffect } from 'react';
import { Layout } from "@/components/Layout";
import CategoryDistributionChart from '@/components/stats/CategoryDistributionChart';

const VideoStats = () => {
  const [loading, setLoading] = useState(false);
  
  // Dados de exemplo - em uma aplicação real, estes dados viriam de uma API
  const categoryData = [
    { category: "Segurança", count: 1, color: "#44AA44" },
    // Adicione mais categorias aqui quando disponíveis
    // { category: "Treinamento", count: 3, color: "#4444FF" },
    // { category: "Procedimentos", count: 2, color: "#FF8800" },
  ];

  return (
    <Layout>
      <div className="space-y-4 p-4">
        <h1 className="text-2xl font-bold">Estatísticas de Vídeos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CategoryDistributionChart 
            data={categoryData}
            title="Estatísticas por Categoria"
            description="Distribuição de vídeos visualizados por categoria"
          />
          
          {/* Você pode adicionar mais cards de estatísticas aqui */}
        </div>
      </div>
      <div className="text-center py-8">A carregar estatísticas...</div>
      <div className="text-center py-8 text-red-600">Erro ao carregar estatísticas. Tente novamente mais tarde.</div>
      <div className="text-center py-8 text-gray-500">Nenhuma estatística disponível para exibir.</div>
    </Layout>
  );
};

export default VideoStats; 