import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, AlertTriangle, BookOpen } from "lucide-react";
import { PieChart, Pie, Legend, Tooltip, Cell, ResponsiveContainer } from "recharts";
import RecentActivityCard from '@/components/RecentActivityCard';
import { User } from "@/types";
import { useNavigate } from "react-router-dom";

interface MobileDashboardProps {
  user: User | null;
  currentLevel: number;
  progressToNextLevel: number;
  totalViews: number;
  totalIncidents: number;
  recentVideos: any[];
  recentIncidents: any[];
  statsByCategory: any[];
  statsBySeverity: any[];
  statsByRisk: any[];
  renderCustomPieChartLabel: any;
}

export default function MobileDashboard({
  user,
  currentLevel,
  progressToNextLevel,
  totalViews,
  totalIncidents,
  recentVideos,
  recentIncidents,
  statsByCategory,
  statsBySeverity,
  statsByRisk,
  renderCustomPieChartLabel
}: MobileDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full space-y-2 p-2 overflow-y-auto">
      {/* Perfil do Usuário */}
      <Card className="w-full border shadow-sm">
        <CardContent className="p-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-robbialac text-white flex items-center justify-center text-sm font-semibold">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-medium truncate">{user?.name}</h2>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-500">Nível {currentLevel}</span>
                <Progress value={progressToNextLevel} className="h-1 w-12" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Categorias de Vídeos */}
      <Card 
        className="w-full border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate('/formacoes')}
      >
        <CardHeader className="p-2 pb-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Formações</CardTitle>
            <div className="bg-robbialac text-white text-[10px] px-2 py-0.5 rounded-full">
              Ver todas
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-50 border border-red-100">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <span className="text-[10px] font-medium text-red-700 text-center">Segurança</span>
              <span className="text-[8px] text-red-500">
                {statsByCategory.find(cat => cat.category === 'Segurança')?.count || 0} vídeos
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 border border-blue-100">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mb-1">
                <Eye className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-[10px] font-medium text-blue-700 text-center">Qualidade</span>
              <span className="text-[8px] text-blue-500">
                {statsByCategory.find(cat => cat.category === 'Qualidade')?.count || 0} vídeos
              </span>
            </div>

            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-green-50 border border-green-100">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-1">
                <BookOpen className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-[10px] font-medium text-green-700 text-center leading-tight">Procedimentos e Regras</span>
              <span className="text-[8px] text-green-500">
                {statsByCategory.find(cat => cat.category === 'Procedimentos e Regras')?.count || 0} vídeos
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mini Cards de Estatísticas */}
      <div className="grid grid-cols-3 w-full gap-2 items-stretch">
        <Card className="w-full border shadow-sm col-span-1">
          <CardContent className="p-2 flex flex-col h-full justify-center">
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-robbialac" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">Visualizações</p>
                <p className="text-xs font-medium">{totalViews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="w-full border shadow-sm col-span-1 flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow bg-primary/5 hover:bg-primary/10"
          onClick={() => navigate('/feed')}
        >
          <CardContent className="p-2 text-center">
              <span className="text-xs font-semibold text-primary">Feed</span>
          </CardContent>
        </Card>

        <Card className="w-full border shadow-sm col-span-1">
          <CardContent className="p-2 flex flex-col h-full justify-center">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-robbialac" />
              <div className="flex-1">
                <p className="text-[10px] text-gray-500">Quase Acidentes</p>
                <p className="text-xs font-medium">{totalIncidents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente em Tabs */}
      <Card className="flex-1 w-full border shadow-sm">
        <CardContent className="p-2">
          <Tabs defaultValue="videos" className="w-full h-full">
            <TabsList className="w-full mb-2 h-7">
              <TabsTrigger value="videos" className="flex-1 text-[10px]">Último Vídeo</TabsTrigger>
              <TabsTrigger value="incidents" className="flex-1 text-[10px]">Último QA</TabsTrigger>
            </TabsList>
            <TabsContent value="videos" className="mt-0 h-full">
              {recentVideos && recentVideos.length > 0 ? (
                <RecentActivityCard videos={recentVideos.slice(0, 1)} incidents={[]} hideHeader={true} className="h-full" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">Nenhum vídeo recente</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="incidents" className="mt-0 h-full">
              {recentIncidents && recentIncidents.length > 0 ? (
                <RecentActivityCard videos={[]} incidents={recentIncidents.slice(0, 1)} hideHeader={true} className="h-full" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">Nenhum quase acidente recente</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Gráficos em Tabs */}
      <Card className="w-full border shadow-sm">
        <CardContent className="p-2">
          <Tabs defaultValue="categories" className="w-full">
            <TabsList className="w-full mb-2 h-7">
              <TabsTrigger value="categories" className="flex-1 text-[10px]">Categorias</TabsTrigger>
              <TabsTrigger value="severity" className="flex-1 text-[10px]">Gravidade</TabsTrigger>
              <TabsTrigger value="risk" className="flex-1 text-[10px]">Risco</TabsTrigger>
            </TabsList>
            <TabsContent value="categories" className="mt-0">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByCategory}
                      dataKey="count"
                      nameKey="category"
                      label={renderCustomPieChartLabel}
                      innerRadius={30}
                      outerRadius={50}
                    >
                      {statsByCategory.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="severity" className="mt-0">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsBySeverity}
                      dataKey="count"
                      nameKey="severity"
                      label={renderCustomPieChartLabel}
                      innerRadius={30}
                      outerRadius={50}
                    >
                      {statsBySeverity.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="risk" className="mt-0">
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByRisk}
                      dataKey="count"
                      nameKey="risk"
                      label={renderCustomPieChartLabel}
                      innerRadius={30}
                      outerRadius={50}
                    >
                      {statsByRisk.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 