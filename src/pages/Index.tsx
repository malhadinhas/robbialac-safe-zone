import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PieChart, 
  Pie, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell, 
  ResponsiveContainer
} from "recharts";
import { Eye, AlertTriangle, Film, Clock, BookOpen, TrendingUp, ChevronLeft, ChevronRight, User, Video as VideoIcon, AlertCircle } from "lucide-react";
import { useIsMobile, useIsTablet, useIsCompactView } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { NoScrollLayout } from "@/components/NoScrollLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getVideos } from "@/services/videoService";
import { getIncidents } from "@/services/incidentService";
import { Video, Incident } from "@/types";
import VideoCategoryPieChart from '@/components/stats/VideoCategoryPieChart';
import RecentActivityCard from '@/components/RecentActivityCard';

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompactView = useIsCompactView();
  const [activeTab, setActiveTab] = useState<"overview" | "videos" | "incidents" | "stats">("overview");
  const [qAChartTab, setQAChartTab] = useState<"severity" | "risk" | "frequency" | "quality">("severity");
  
  // Estados para dados da API
  const [videos, setVideos] = useState<Video[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [videosData, incidentsData] = await Promise.all([
          getVideos().catch(() => []),
          getIncidents().catch(() => [])
        ]);
        setVideos(videosData || []);
        setIncidents(incidentsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        setVideos([]);
        setIncidents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dados processados
  const recentVideos = videos?.slice(0, 3) || [];
  const recentIncidents = incidents?.slice(0, 3) || [];
  
  // Cálculo da próxima medalha
  const nextMedal = user?.medals ? user.medals.find(medal => !medal.acquired) : null;
  
  // Progress para o próximo nível
  const progressToNextLevel = Math.min(((user?.points || 0) % 500) / 5, 100);
  const currentLevel = user?.level || 1;
  const pointsToNextLevel = 500 - ((user?.points || 0) % 500);

  // Estatísticas por categoria
  const statsByCategory = videos.reduce((acc, video) => {
    const category = acc.find(stat => stat.category === video.category);
    if (category) {
      category.count++;
    } else {
      acc.push({
        category: video.category,
        count: 1,
        color: video.category === 'Segurança' ? '#FF4444' : // Vermelho para Segurança
               video.category === 'Qualidade' ? '#4444FF' : // Azul para Qualidade
               video.category === 'Procedimentos e Regras' ? '#44AA44' : // Verde para Procedimentos
               video.category === 'Treinamento' ? '#FFAA44' : // Laranja para Treinamento
               video.category === 'Equipamentos' ? '#AA44AA' : // Roxo para Equipamentos
               '#888888' // Cinza para Outros
      });
    }
    return acc;
  }, [] as { category: string; count: number; color: string }[]);

  // Estatísticas por gravidade
  const statsBySeverity = incidents.reduce((acc, incident) => {
    const severity = acc.find(stat => stat.severity === incident.severity);
    if (severity) {
      severity.count++;
    } else {
      acc.push({
        severity: incident.severity,
        count: 1,
        color: incident.severity === 'Alto' ? '#FF4444' : 
               incident.severity === 'Médio' ? '#FFAA44' : '#FFFF44'
      });
    }
    return acc;
  }, [] as { severity: string; count: number; color: string }[]);

  // Estatísticas por risco
  const statsByRisk = incidents.reduce((acc, incident) => {
    const riskLevel = incident.risk && incident.risk > 24 ? "Alto" : 
                     incident.risk && incident.risk >= 8 ? "Médio" : "Baixo";
    
    const existingEntry = acc.find(stat => stat.risk === riskLevel);
    if (existingEntry) {
      existingEntry.count++;
    } else {
      acc.push({
        risk: riskLevel,
        count: 1,
        color: riskLevel === 'Alto' ? '#FF4444' : 
               riskLevel === 'Médio' ? '#FFAA44' : '#FFFF44'
      });
    }
    return acc;
  }, [] as { risk: string; count: number; color: string }[]);

  // Estatísticas por qualidade QA
  const statsByQAQuality = incidents.reduce((acc, incident) => {
    if (!incident.qaQuality) return acc;
    
    const existingEntry = acc.find(stat => stat.quality === incident.qaQuality);
    if (existingEntry) {
      existingEntry.count++;
    } else {
      acc.push({
        quality: incident.qaQuality,
        count: 1,
        color: incident.qaQuality === 'Alta' ? '#FF4444' : 
               incident.qaQuality === 'Média' ? '#FFAA44' : '#44FF44'
      });
    }
    return acc;
  }, [] as { quality: string; count: number; color: string }[]);

  // Estatísticas por frequência
  const statsByFrequency = incidents.reduce((acc, incident) => {
    if (!incident.frequency) return acc;
    
    const existingEntry = acc.find(stat => stat.frequency === incident.frequency);
    if (existingEntry) {
      existingEntry.count++;
    } else {
      acc.push({
        frequency: incident.frequency,
        count: 1,
        color: incident.frequency === 'Alta' ? '#FF4444' : 
               incident.frequency === 'Moderada' ? '#FFAA44' : '#44FF44'
      });
    }
    return acc;
  }, [] as { frequency: string; count: number; color: string }[]);

  // Calcular estatísticas para cards
  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
  const totalIncidents = incidents.length;
  const totalVideos = videos.length;
  const totalMedalsAcquired = user?.medals?.filter(medal => medal.acquired)?.length || 0;

  // Custom label renderer for PieChart that shows only percentages
  const renderCustomPieChartLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
  
    return (
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
    );
  };

  // Define dashboard sections for mobile/tablet view
  const dashboardSections = [
    // Section 1: Overview
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo de volta, {user?.name}!</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Seu Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-500">Nível {currentLevel}</span>
              <span className="text-gray-500">Nível {currentLevel + 1}</span>
            </div>
            <Progress value={progressToNextLevel} className="mb-2" />
            <div className="text-sm text-gray-500 text-center">
              {pointsToNextLevel} pontos para o próximo nível
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pontuação Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="text-4xl font-bold text-robbialac">{user?.points || 0}</div>
              <TrendingUp className="ml-2 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>,
    
    // Section 2: Videos
    <>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Vídeos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RecentActivityCard videos={recentVideos || []} incidents={[]} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>,
    
    // Section 3: Incidents
    <>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Quase Acidentes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RecentActivityCard videos={[]} incidents={recentIncidents || []} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>,
    
    // Section 4: Statistics
    <>
      <div className="grid grid-cols-1 gap-4 mb-4">
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <VideoCategoryPieChart videos={videos || []} />
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsBySeverity}>
                    <XAxis dataKey="severity" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-robbialac"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-red-500 mb-4">Erro ao carregar dados: {error}</div>
          <Button onClick={() => window.location.reload()}>Tentar Novamente</Button>
        </div>
      </Layout>
    );
  }

  const pageContent = isCompactView ? (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="overview" className="flex flex-col items-center gap-1">
            <User className="h-4 w-4" />
            <span className="text-xs">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex flex-col items-center gap-1">
            <VideoIcon className="h-4 w-4" />
            <span className="text-xs">Vídeos</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex flex-col items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs">Quase Acidentes</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex flex-col items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">Estatísticas</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {dashboardSections[0]}
        </TabsContent>
        
        <TabsContent value="videos">
          {dashboardSections[1]}
        </TabsContent>
        
        <TabsContent value="incidents">
          {dashboardSections[2]}
        </TabsContent>
        
        <TabsContent value="stats">
          {dashboardSections[3]}
        </TabsContent>
      </Tabs>
    </div>
  ) : (
    <div className="p-4">
      {dashboardSections.map((section, index) => (
        <div key={index} className="mb-8">
          {section}
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      {pageContent}
    </Layout>
  );
}
