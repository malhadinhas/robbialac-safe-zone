
import { Layout } from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  mockStatsByCategory, 
  mockStatsByZone, 
  mockStatsBySeverity, 
  mockVideos, 
  mockIncidents,
  mockMedals 
} from "@/services/mockData";
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
import { Eye, AlertTriangle, Film, Clock, BookOpen, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<"videos" | "quaseAcidentes">("videos");

  // Dados simplificados para exibição
  const recentVideos = mockVideos.slice(0, 3);
  const recentIncidents = mockIncidents.slice(0, 3);
  
  // Cálculo da próxima medalha
  const nextMedal = mockMedals.find(medal => !medal.acquired);
  
  // Progress para o próximo nível
  const progressToNextLevel = Math.min(((user?.points || 0) % 500) / 5, 100);
  const currentLevel = user?.level || 1;
  const pointsToNextLevel = 500 - ((user?.points || 0) % 500);

  return (
    <Layout>
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
                  data={mockStatsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                >
                  {mockStatsByCategory.map((entry, index) => (
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
            <CardTitle className="text-lg font-medium">Quase Acidentes por Severidade</CardTitle>
            <CardDescription>Total de incidentes reportados por nível de severidade</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockStatsBySeverity}>
                <XAxis dataKey="severity" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Quantidade">
                  {mockStatsBySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Recent Activity */}
      <Card className="bg-white shadow mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium">Atividade Recente</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === "videos" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("videos")}
                className={activeTab === "videos" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                <Film className="w-4 h-4 mr-1" /> Vídeos
              </Button>
              <Button 
                variant={activeTab === "quaseAcidentes" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("quaseAcidentes")}
                className={activeTab === "quaseAcidentes" ? "bg-robbialac hover:bg-robbialac-dark" : ""}
              >
                <AlertTriangle className="w-4 h-4 mr-1" /> Quase Acidentes
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "videos" ? (
            <div className="space-y-4">
              {recentVideos.map((video) => (
                <div key={video.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 w-16 h-12 bg-gray-200 rounded overflow-hidden mr-4">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{video.title}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <Eye className="w-3 h-3 mr-1" /> {video.views} visualizações
                      <Clock className="w-3 h-3 ml-3 mr-1" /> {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {video.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className={`flex items-center p-3 border-l-4 rounded-lg ${
                  incident.severity === "Alto" 
                    ? "border-l-red-500 bg-red-50" 
                    : incident.severity === "Médio"
                    ? "border-l-orange-500 bg-orange-50"
                    : "border-l-yellow-400 bg-yellow-50"
                }`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{incident.title}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <AlertTriangle className={`w-3 h-3 mr-1 ${
                        incident.severity === "Alto" 
                          ? "text-red-500" 
                          : incident.severity === "Médio"
                          ? "text-orange-500"
                          : "text-yellow-500"
                      }`} /> 
                      Severidade: {incident.severity} • Status: {incident.status}
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      incident.status === "Resolvido"
                        ? "bg-green-100 text-green-800"
                        : incident.status === "Em Análise"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {incident.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
                <p className="text-2xl font-semibold">678</p>
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
                <p className="text-2xl font-semibold">28</p>
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
                <p className="text-2xl font-semibold">12</p>
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
                <p className="text-2xl font-semibold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
