import React, { useEffect } from 'react';
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
  };
  incidents: number;
  target: number;
  percentage: number;
}

interface Props {
  data: DepartmentData[];
}

export default function DepartmentIncidentsChart({ data }: Props) {
  useEffect(() => {
    // Remover: console.log('Dados recebidos no gráfico:', data);
  }, [data]);

  const chartData = data.map(item => {
    // Remover: console.log('Processando item para o gráfico:', item);
    return {
      name: item.department.name,
      incidentes: item.incidents,
      meta: item.target,
      color: item.department.color
    };
  });

  // Remover: console.log('Dados processados para o gráfico:', chartData);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const reportados = payload.find(p => p.name === 'Quase Acidentes Reportados')?.value || 0;
      const meta = payload.find(p => p.name === 'Meta do Departamento')?.value || 0;
      const percentagem = meta > 0 ? Math.round((reportados / meta) * 100) : 0;
      
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
    <div className="w-full h-[600px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={70}
            tickMargin={25}
            interval={0}
          >
            <Label value="Departamentos" offset={-60} position="insideBottom" />
          </XAxis>
          <YAxis>
            <Label value="Quantidade de Quase Acidentes" angle={-90} position="insideLeft" offset={0} />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />
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