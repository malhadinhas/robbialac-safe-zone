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
  ResponsiveContainer,
  CartesianGrid
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
import MobileDashboard from "@/components/dashboard/MobileDashboard";
import { CategoryVideosCard } from "@/components/dashboard/CategoryVideosCard";
import { FeedCard } from "@/components/dashboard/FeedCard";
import { useNavigate } from "react-router-dom";
import AvatarUploader from "@/components/ui/AvatarUploader";
import { updateUser } from "@/services/userService";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, updateUserAvatar } = useAuth();
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
  const [avatar, setAvatar] = useState<string | undefined>(user?.avatarUrl);

  const navigate = useNavigate();

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

  // Handler para alteração do avatar
  const handleAvatarChange = async (base64: string) => {
    if (!user) return;
    try {
      await updateUser({ ...user, id: user._id, avatarUrl: base64 });
      setAvatar(base64);
      updateUserAvatar(base64);
      toast.success("Avatar atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar avatar");
    }
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

  return (
    <Layout>
      {isCompactView ? (
        <MobileDashboard
          user={user}
          videos={videos}
          incidents={incidents}
          loading={loading}
          error={error}
          statsByCategory={statsByCategory}
          statsBySeverity={statsBySeverity}
          statsByRisk={statsByRisk}
          statsByQAQuality={statsByQAQuality}
          statsByFrequency={statsByFrequency}
          totalViews={totalViews}
          totalIncidents={totalIncidents}
          totalVideos={totalVideos}
          totalMedalsAcquired={totalMedalsAcquired}
          progressToNextLevel={progressToNextLevel}
          currentLevel={currentLevel}
          pointsToNextLevel={pointsToNextLevel}
        />
      ) : (
        <div className="h-full p-6 space-y-8 overflow-y-auto bg-[#f7faff]">
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
          <p className="text-gray-500 mb-6">Bem-vindo de volta, {user?.name}!</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Coluna 1: Cards de progresso do usuário */}
            <div className="md:col-span-1 grid grid-cols-1 gap-8">
              <Card className="h-auto flex flex-col items-center p-6 rounded-xl shadow-lg bg-white">
                {/* Avatar editável */}
                <AvatarUploader
                  avatarUrl={avatar}
                  name={user?.name}
                  onAvatarChange={handleAvatarChange}
                />
                <CardHeader className="pb-2 space-y-0 w-full text-center">
                  <CardTitle className="text-lg font-bold text-gray-800">Seu Progresso</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 w-full">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700">Nível {currentLevel}</span>
                      <span className="font-semibold text-gray-400">Nível {currentLevel + 1}</span>
                    </div>
                    <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute left-0 top-0 h-4 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full transition-all duration-500"
                        style={{ width: `${progressToNextLevel}%` }}
                      />
                      <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-white font-bold">
                        {Math.round(progressToNextLevel)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      {pointsToNextLevel} pontos para o próximo nível
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="h-auto p-6 rounded-xl shadow-lg bg-white flex flex-col items-center justify-center">
                <CardHeader className="pb-2 space-y-0 w-full text-center">
                  <CardTitle className="text-base font-semibold text-gray-800">Pontuação Total</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 w-full flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold mb-3 text-blue-600">{user?.points || 0}</p>
                        <Button
                          variant="outline"
                    size="lg"
                    className="rounded-full bg-blue-500 text-white hover:bg-blue-600 shadow text-base px-6 py-2 mt-2"
                          onClick={() => navigate('/ranking')}
                        >
                          Ver Ranking
                        </Button>
                </CardContent>
              </Card>
            </div>
            {/* Coluna 2-4: Feed expandido */}
            <div className="md:col-span-3">
              <FeedCard />
            </div>
          </div>

          <CategoryVideosCard videos={videos} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="md:col-span-1">
              <Card className="rounded-xl shadow-lg bg-white p-6 h-full flex flex-col justify-center">
              <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">Estatísticas por Categoria</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Distribuição de vídeos visualizados por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex justify-center items-center h-[220px] w-full">
                    <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={statsByCategory}
                        dataKey="count"
                        nameKey="category"
                      cx="50%"
                      cy="50%"
                          innerRadius={60}
                        outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                          stroke="none"
                    >
                      {statsByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#0286e0' : index === 1 ? '#ff9b87' : '#e9eef3'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            </div>
            <div className="md:col-span-2">
              <Card className="rounded-xl shadow-lg bg-white p-6 h-full flex flex-col justify-center">
              <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-800">Estatísticas de Quase Acidentes</CardTitle>
                  <CardDescription className="text-sm text-gray-500">Análise por gravidade, risco e frequência</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={qAChartTab} onValueChange={(value: any) => setQAChartTab(value)}>
                    <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-100 rounded-full p-1">
                      <TabsTrigger value="severity" className="rounded-full">Gravidade</TabsTrigger>
                      <TabsTrigger value="risk" className="rounded-full">Risco</TabsTrigger>
                      <TabsTrigger value="frequency" className="rounded-full">Frequência</TabsTrigger>
                      <TabsTrigger value="quality" className="rounded-full">Qualidade</TabsTrigger>
                  </TabsList>
                  <TabsContent value="severity">
                    <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsBySeverity} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9eef3" />
                            <XAxis dataKey="severity" axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                      <Tooltip />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#0286e0" />
                    </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="risk">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsByRisk} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9eef3" />
                            <XAxis dataKey="risk" axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                      <Tooltip />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#ff9b87" />
                    </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="frequency">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsByFrequency} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9eef3" />
                            <XAxis dataKey="frequency" axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                      <Tooltip />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#0286e0" />
                    </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="quality">
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={statsByQAQuality} barSize={24}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e9eef3" />
                            <XAxis dataKey="quality" axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "#b0b7c3", fontSize: 14 }} />
                      <Tooltip />
                            <Bar dataKey="count" radius={[10, 10, 0, 0]} fill="#ff9b87" />
                    </BarChart>
                </ResponsiveContainer>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            </div>
          </div>
          </div>
      )}
    </Layout>
  );
}
