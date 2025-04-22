import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { getUserMedals, getUnacquiredMedals, Medal } from "@/services/medalService";
import { getUserPointsBreakdown, UserPointsBreakdown, getUserRanking, UserRanking } from "@/services/statsService";
import { getUserActivities, UserActivity } from "@/services/activityService";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NoScrollLayout } from "@/components/NoScrollLayout";
import { useIsCompactView } from "@/hooks/use-mobile";
import MedalCard from "@/components/MedalCard";
import { useNavigate } from "react-router-dom";

export default function Pontuacao() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCompactView = useIsCompactView();
  const [medals, setMedals] = useState<Medal[]>([]);
  const [unacquiredMedals, setUnacquiredMedals] = useState<Medal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pointsBreakdown, setPointsBreakdown] = useState<UserPointsBreakdown[]>([]);
  const [userRanking, setUserRanking] = useState<UserRanking>({ position: 0, totalUsers: 0, points: 0 });
  const [activities, setActivities] = useState<UserActivity[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Buscar medalhas conquistadas
        const medalsData = await getUserMedals(user?._id);
        setMedals(medalsData);
        
        // Buscar medalhas não conquistadas
        const unacquiredMedalsData = await getUnacquiredMedals(user?._id);
        setUnacquiredMedals(unacquiredMedalsData);
        
        // Buscar distribuição de pontos
        const pointsData = await getUserPointsBreakdown(user?._id);
        setPointsBreakdown(pointsData);
        
        // Buscar ranking do usuário
        const rankingData = await getUserRanking(user?._id);
        setUserRanking(rankingData);
        
        // Buscar histórico de atividades
        const activitiesData = await getUserActivities(user?._id, 20);
        setActivities(activitiesData);
      } catch (error) {
        // console.error("Pontuacao.tsx: Erro ao buscar dados:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id) {
      fetchData();
    } else {
      setTimeout(() => {
        if (!user?._id) {
          setIsLoading(false);
        }
      }, 3000);
    }
  }, [user?._id]);
  
  // Cálculo da próxima medalha e progresso
  const earnedMedals = medals || [];
  
  // Progress para o próximo nível
  const progressToNextLevel = Math.min(((user?.points || 0) % 500) / 5, 100);
  const currentLevel = user?.level || 1;
  const pointsToNextLevel = 500 - ((user?.points || 0) % 500);
  
  const getTypeIcon = (category: string) => {
    switch (category) {
      case 'training':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-green-600">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
      case 'incident':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-orange-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'medal':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-yellow-500">
            <circle cx="12" cy="8" r="7" />
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-blue-600">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-gray-400">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
    }
  };
  
  // Versão compacta do header
  const headerSection = (
    <div className="mb-2 sm:mb-6 text-center">
      <h1 className="text-base sm:text-3xl font-bold text-gray-800">Sua Pontuação</h1>
      <p className="text-xs sm:text-base text-gray-600">Progresso e conquistas</p>
    </div>
  );
  
  // Versão compacta da seção de progresso
  const progressSection = (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-6 mb-2 sm:mb-8">
      <Card className="col-span-1 sm:col-span-2 hover:shadow-lg transition-shadow">
        <CardHeader className="p-2 sm:pb-2 border-b">
          <CardTitle className="text-sm sm:text-xl font-bold">Nível {currentLevel}</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Progress value={progressToNextLevel} className="h-3 bg-gray-100" />
            <div className="flex items-center justify-between text-[10px] sm:text-sm">
              <span className="text-gray-600 font-medium">{user?.points || 0} pts</span>
              <span className="text-gray-600 font-medium">Falta: {pointsToNextLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-2 border-b">
          <CardTitle className="text-sm sm:text-xl font-bold">Total</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-col items-center space-y-3">
            <div className="text-2xl sm:text-5xl font-bold text-robbialac">{user?.points || 0}</div>
            <div className="flex flex-col items-center gap-2 w-full">
              <p className="text-[10px] sm:text-sm text-gray-600 font-medium">
                #{userRanking.position} de {userRanking.totalUsers}
              </p>
              <Button 
                variant="default"
                size="sm"
                className="w-full bg-robbialac hover:bg-robbialac-dark text-[10px] sm:text-sm font-medium"
                onClick={() => navigate('/ranking')}
              >
                Ver Ranking
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  // Versão compacta das medalhas
  const medalsSection = (
    <div className="space-y-2 sm:space-y-10">
      <div>
        <h2 className="text-sm sm:text-2xl font-bold mb-2">Medalhas</h2>
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-1 sm:gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-20 sm:h-40"></div>
              </div>
            ))}
          </div>
        ) : medals.length === 0 ? (
          <div className="text-center p-4 sm:py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <p className="text-[10px] sm:text-sm text-gray-500 font-medium">Complete atividades para ganhar medalhas</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-6">
            {medals.slice(0, 3).map((medal) => (
              <div key={`earned-${medal._id}`} className="hover:scale-105 transition-transform">
              <MedalCard 
                medal={medal} 
                isAcquired={true} 
                userPoints={user?.points || 0} 
                  isCompact={isCompactView}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  // Versão compacta do histórico
  const historySection = (
    <div className="mt-4">
      <h2 className="text-sm sm:text-2xl font-bold mb-2">Histórico Recente</h2>
      <div className="space-y-2">
        {activities.slice(0, 3).map((activity) => (
          <div key={activity.id} className="flex items-start p-3 border border-gray-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-all">
            <div className="mr-3 mt-1 scale-90 sm:scale-100">{getTypeIcon(activity.category)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-[11px] sm:text-base truncate">{activity.description}</div>
                  <div className="text-[9px] sm:text-sm text-gray-500 font-medium">
                    {format(parseISO(activity.date), "dd/MM/yyyy")}
                  </div>
                </div>
                <div className="px-2 py-1 bg-robbialac/10 rounded-full text-[10px] sm:text-sm font-bold text-robbialac whitespace-nowrap">
                  +{activity.points}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
    </div>
  );
  
  // Versão compacta do sistema de pontuação
  const pointsSystemSection = (
    <Card className="mt-4 hover:shadow-lg transition-shadow">
      <CardHeader className="p-3 border-b">
        <CardTitle className="text-sm sm:text-xl font-bold">Como Pontuar</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {getTypeIcon('video')}
              <h3 className="font-bold text-[11px] sm:text-base text-blue-800">Vídeos</h3>
            </div>
            <ul className="text-[9px] sm:text-sm space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="font-medium">Segurança: 50 pts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="font-medium">Formação: +100 pts</span>
              </li>
              <li className="flex items-center gap-2 text-[8px] sm:text-xs text-gray-500 mt-3 italic">
                Pontos atribuídos ao completar a visualização
              </li>
            </ul>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {getTypeIcon('incident')}
              <h3 className="font-bold text-[11px] sm:text-base text-orange-800">Incidentes</h3>
            </div>
            <ul className="text-[9px] sm:text-sm space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span className="font-medium">Baixo: 50 pts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span className="font-medium">Alto: 100 pts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span className="font-medium">Com evidência: +25 pts</span>
              </li>
            </ul>
          </div>
          
          <div className="p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <div className="flex items-center gap-2 mb-3">
              {getTypeIcon('medal')}
              <h3 className="font-bold text-[11px] sm:text-base text-yellow-800">Bônus</h3>
            </div>
            <ul className="text-[9px] sm:text-sm space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="font-medium">Medalha: 100 pts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="font-medium">Área: 200 pts</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                <span className="font-medium">Nível: +500 pts</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Layout responsivo sem tabs
  const pageContent = (
    <div className="space-y-2 sm:space-y-4">
      {headerSection}
      {progressSection}
      {medalsSection}
      {historySection}
      {pointsSystemSection}
    </div>
  );
  
  if (isCompactView) {
    // Mobile Layout
    return (
      <Layout>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {headerSection}
          {progressSection}
          {medalsSection}
          {historySection}
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="h-full overflow-y-auto p-4 sm:p-6">
      {pageContent}
      </div>
    </Layout>
  );
}
