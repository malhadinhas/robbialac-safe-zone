import { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video } from "@/types";

interface VideoCategoryPieChartProps {
  videos: Video[];
  title?: string;
  description?: string;
}

export const VideoCategoryPieChart = ({ 
  videos = [], 
  title = "Estatísticas por Categoria",
  description = "Distribuição de vídeos visualizados por categoria"
}: VideoCategoryPieChartProps) => {
  
  // Processa os dados dos vídeos para o formato do gráfico
  const processData = (videos: Video[]) => {
    const categoryMap = new Map<string, { count: number; color: string }>();
    
    videos.forEach(video => {
      const category = video.category;
      const current = categoryMap.get(category) || { 
        count: 0, 
        color: category === 'Segurança' ? '#FF4444' : // Vermelho para Segurança
               category === 'Qualidade' ? '#4444FF' : // Azul para Qualidade
               category === 'Procedimentos e Regras' ? '#44AA44' : // Verde para Procedimentos
               category === 'Treinamento' ? '#FFAA44' : // Laranja para Treinamento
               category === 'Equipamentos' ? '#AA44AA' : // Roxo para Equipamentos
               '#888888' // Cinza para Outros
      };
      
      categoryMap.set(category, {
        ...current,
        count: current.count + 1
      });
    });
    
    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      color: data.color
    }));
  };

  const data = processData(videos);
  
  // Renderiza rótulos personalizados no gráfico circular
  const renderCustomizedLabel = ({ 
    cx, 
    cy, 
    midAngle, 
    innerRadius, 
    outerRadius, 
    percent, 
    index 
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor="middle" 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border rounded-md shadow-sm">
          <p className="font-medium text-sm">{data.category}</p>
          <p className="text-xs">
            <span className="font-medium">Quantidade:</span> {data.count}
          </p>
          <p className="text-xs">
            <span className="font-medium">Percentual:</span> {(payload[0].percent * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (videos.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center text-gray-500">
            Não há dados para exibir
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCategoryPieChart; 