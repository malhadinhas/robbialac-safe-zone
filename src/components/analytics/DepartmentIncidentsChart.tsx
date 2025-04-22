import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Label
} from 'recharts';

interface DepartmentData {
  department: {
    id: string;
    name: string;
    color: string;
    employeeCount: number;
    label: string;
  };
  incidents: number;
  target: number;
  percentage: number;
}

interface Props {
  data: DepartmentData[];
}

export default function DepartmentIncidentsChart({ data }: Props) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Remover: console.log('Dados recebidos no gráfico:', data);
  }, [data]);

  const chartData = data.map(item => {
    // Remover: console.log('Processando item para o gráfico:', item);
    return {
      name: item.department.label,
      incidentes: item.incidents,
      meta: item.target,
      color: item.department.color
    };
  });

  // Remover: console.log('Dados processados para o gráfico:', chartData);

  // Calcular o valor máximo para o domínio do eixo Y (NOVA LÓGICA)
  const calculateMaxYDomain = () => {
    if (!data || data.length === 0) {
      return 10; // Retorna 10 se não houver dados
    }

    // Encontra a meta máxima
    const maxTarget = data.reduce((max, item) => Math.max(max, item.target), 0);
    
    // Encontra o máximo de incidentes reportados
    const maxIncidents = data.reduce((max, item) => Math.max(max, item.incidents), 0);
    
    // O valor base é o maior entre a meta máxima e os incidentes máximos
    const baseValue = Math.max(maxTarget, maxIncidents);

    // Garante que o máximo seja pelo menos 10
    const baseMax = Math.max(10, baseValue);
    
    // Adiciona uma pequena margem (ex: 10%)
    const paddedMax = Math.ceil(baseMax * 1.1);

    return paddedMax;
  };

  const maxYDomain = calculateMaxYDomain();

  const CustomTooltip = ({ active, payload, label }: any) => {
    // DEBUG: Logar o conteúdo do payload -- REMOVER
    // console.log("Tooltip Payload:", payload);

    if (active && payload && payload.length) {
      const reportados = payload.find(p => p.name === 'Quase Acidentes Reportados')?.value || 0;
      const meta = payload.find(p => p.name === 'Meta do Departamento')?.value || 0;
      const percentagem = meta > 0 ? Math.round((reportados / meta) * 100) : 0;
      
      // DEBUG: Logar valores encontrados -- REMOVER
      // console.log(`Tooltip - Label: ${label}, Reportados: ${reportados}, Meta: ${meta}`);

      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{label}</p>
          <p className="text-sm">Reportados: {reportados}</p>
          <p className="text-sm">Meta: {meta}</p>
          <p className="text-sm font-medium mt-1">
            {percentagem}% da meta {percentagem >= 100 ? '✅' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!chartData.length) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center">
        <p>Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] sm:h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={isMobile ? 
            { top: 20, right: 10, left: 10, bottom: 60 } : 
            { top: 20, right: 30, left: 20, bottom: 60 }
          }
          barSize={isMobile ? 20 : 40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={60}
            tickMargin={20}
            interval={0}
            tick={{ fontSize: isMobile ? 10 : 12 }}
          >
            <Label 
              value="Departamentos" 
              offset={-70} 
              position="insideBottom"
              style={{ fontSize: isMobile ? 12 : 14 }}
            />
          </XAxis>
          <YAxis 
            domain={[0, maxYDomain]}
            tick={{ fontSize: isMobile ? 10 : 12 }}
            tickMargin={2}
          >
            <Label 
              value="Quantidade de Quase Acidentes" 
              angle={-90} 
              position="insideLeft" 
              offset={-15}
              style={{ fontSize: isMobile ? 10 : 12 }}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            height={36}
            wrapperStyle={{ fontSize: isMobile ? 10 : 12 }}
          />
          <Bar 
            dataKey="incidentes" 
            name="Quase Acidentes Reportados" 
            fill="#8884d8"
          />
          <Bar 
            dataKey="meta" 
            name="Meta do Departamento"
            fill="#82ca9d"
            opacity={0.3}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 