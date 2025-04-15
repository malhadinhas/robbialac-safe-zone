import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
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
import { Eye, AlertTriangle, Film, Clock, BookOpen, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"videos" | "quaseAcidentes">("videos");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
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
          getVideos(),
          getIncidents()
        ]);
        setVideos(videosData);
        setIncidents(incidentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Dados processados
  const recentVideos = videos.slice(0, 3);
  const recentIncidents = incidents.slice(0, 3);
  
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
        color: video.category === 'Segurança' ? '#44AA44' : // Verde 
               video.category === 'Qualidade' ? '#4444FF' : // Azul
               '#FF8800'  // Laranja para "Procedimentos e Regras"
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

  // Define dashboard sections for mobile/tablet view
  const dashboardSections = [
    // Section 1: User Stats
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
            <div className="text-sm text-gray-500 text-center mt-2">
              Continue participando para ganhar mais pontos!
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Próxima Medalha</CardTitle>
          </CardHeader>
          <CardContent>
            {nextMedal ? (
              <div className="flex items-center">
                <div className="text-4xl mr-3">{nextMedal.image}</div>
                <div>
                  <div className="font-medium">{nextMedal.name}</div>
                  <div className="text-sm text-gray-500">{nextMedal.description}</div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">Todas as medalhas conquistadas!</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>,
    
    // Section 2: Charts
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Estatísticas</h2>
      
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Estatísticas por Categoria</CardTitle>
            <CardDescription>Distribuição de vídeos visualizados por categoria</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomPieChartLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                >
                  {statsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardHeader>
            <CardTitle className="text-lg font-medium">Quase Acidentes por Parâmetros</CardTitle>
            <CardDescription>Análise de incidentes por diferentes métricas</CardDescription>
            <div className="flex mt-2 space-x-1">
              <Button
                variant={qAChartTab === "severity" ? "default" : "outline"}
                size="sm"
                onClick={() => setQAChartTab("severity")}
                className={qAChartTab === "severity" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                Gravidade
              </Button>
              <Button
                variant={qAChartTab === "risk" ? "default" : "outline"}
                size="sm"
                onClick={() => setQAChartTab("risk")}
                className={qAChartTab === "risk" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                Risco
              </Button>
              <Button
                variant={qAChartTab === "frequency" ? "default" : "outline"}
                size="sm"
                onClick={() => setQAChartTab("frequency")}
                className={qAChartTab === "frequency" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                Frequência
              </Button>
              <Button
                variant={qAChartTab === "quality" ? "default" : "outline"}
                size="sm"
                onClick={() => setQAChartTab("quality")}
                className={qAChartTab === "quality" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                Qualidade QA
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {qAChartTab === "severity" && (
                <BarChart data={statsBySeverity}>
                  <XAxis dataKey="severity" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Quantidade">
                    {statsBySeverity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              {qAChartTab === "risk" && (
                <BarChart data={statsByRisk}>
                  <XAxis dataKey="risk" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Quantidade">
                    {statsByRisk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              {qAChartTab === "frequency" && (
                <BarChart data={statsByFrequency}>
                  <XAxis dataKey="frequency" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Quantidade">
                    {statsByFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
              {qAChartTab === "quality" && (
                <BarChart data={statsByQAQuality}>
                  <XAxis dataKey="quality" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" name="Quantidade">
                    {statsByQAQuality.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>,
    
    // Section 3: Recent Activity
    <>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Atividade Recente</h2>
      
      <RecentActivityCard 
        videos={recentVideos}
        incidents={recentIncidents}
        className="bg-white shadow mb-4"
      />
      
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-white shadow">
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-blue-100 rounded-md mr-2">
                <Eye className="text-robbialac h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Visualizações</p>
                <p className="text-lg font-semibold">{totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-yellow-100 rounded-md mr-2">
                <AlertTriangle className="text-robbialac-orange h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Quase Acidentes</p>
                <p className="text-lg font-semibold">{totalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-green-100 rounded-md mr-2">
                <BookOpen className="text-green-600 h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Formações</p>
                <p className="text-lg font-semibold">{totalVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow">
          <CardContent className="pt-4">
            <div className="flex items-center">
              <div className="p-1.5 bg-purple-100 rounded-md mr-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                    className="text-purple-600">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Medalhas</p>
                <p className="text-lg font-semibold">{totalMedalsAcquired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  ];

  return (
    <Layout>
      {isCompactView ? (
        <NoScrollLayout sections={dashboardSections} />
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-gray-600">Bem-vindo de volta, {user?.name}!</p>
          </div>
    
          {/* Top Section - User Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div className="text-sm text-gray-500 text-center mt-2">
                  Continue participando para ganhar mais pontos!
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Próxima Medalha</CardTitle>
              </CardHeader>
              <CardContent>
                {nextMedal ? (
                  <div className="flex items-center">
                    <div className="text-4xl mr-3">{nextMedal.image}</div>
                    <div>
                      <div className="font-medium">{nextMedal.name}</div>
                      <div className="text-sm text-gray-500">{nextMedal.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">Todas as medalhas conquistadas!</div>
                )}
              </CardContent>
            </Card>
          </div>
    
          {/* Middle Section - Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Estatísticas por Categoria</CardTitle>
                <CardDescription>Distribuição de vídeos visualizados por categoria</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomPieChartLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="category"
                    >
                      {statsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quase Acidentes por Parâmetros</CardTitle>
                <CardDescription>Análise de incidentes por diferentes métricas</CardDescription>
                <div className="flex mt-2 space-x-1">
                  <Button
                    variant={qAChartTab === "severity" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQAChartTab("severity")}
                    className={qAChartTab === "severity" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
                  >
                    Gravidade
                  </Button>
                  <Button
                    variant={qAChartTab === "risk" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQAChartTab("risk")}
                    className={qAChartTab === "risk" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
                  >
                    Risco
                  </Button>
                  <Button
                    variant={qAChartTab === "frequency" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQAChartTab("frequency")}
                    className={qAChartTab === "frequency" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
                  >
                    Frequência
                  </Button>
                  <Button
                    variant={qAChartTab === "quality" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setQAChartTab("quality")}
                    className={qAChartTab === "quality" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
                  >
                    Qualidade QA
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {qAChartTab === "severity" && (
                    <BarChart data={statsBySeverity}>
                      <XAxis dataKey="severity" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Quantidade">
                        {statsBySeverity.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                  {qAChartTab === "risk" && (
                    <BarChart data={statsByRisk}>
                      <XAxis dataKey="risk" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Quantidade">
                        {statsByRisk.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                  {qAChartTab === "frequency" && (
                    <BarChart data={statsByFrequency}>
                      <XAxis dataKey="frequency" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Quantidade">
                        {statsByFrequency.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                  {qAChartTab === "quality" && (
                    <BarChart data={statsByQAQuality}>
                      <XAxis dataKey="quality" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Quantidade">
                        {statsByQAQuality.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
    
          {/* Bottom Section - Recent Activity */}
          <RecentActivityCard 
            videos={recentVideos}
            incidents={recentIncidents}
            className="bg-white shadow mb-6"
          />
    
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white shadow">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-md mr-4">
                    <Eye className="text-robbialac h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Visualizações</p>
                    <p className="text-2xl font-semibold">{totalViews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-md mr-4">
                    <AlertTriangle className="text-robbialac-orange h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Quase Acidentes</p>
                    <p className="text-2xl font-semibold">{totalIncidents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-md mr-4">
                    <BookOpen className="text-green-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Formações Completas</p>
                    <p className="text-2xl font-semibold">{totalVideos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-md mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                        className="text-purple-600">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Medalhas Ganhas</p>
                    <p className="text-2xl font-semibold">{totalMedalsAcquired}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
