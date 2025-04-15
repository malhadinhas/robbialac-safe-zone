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

export default function Pontuacao() {
  const { user } = useAuth();
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
  
  // Define sections for the NoScrollLayout
  const headerSection = (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-gray-800">Sua Pontuação</h1>
      <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
    </div>
  );
  
  const progressSection = (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="col-span-1 md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Progresso de Nível</CardTitle>
          <CardDescription>
            Você está no nível {currentLevel}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Nível {currentLevel}</span>
              <span className="text-gray-500">Nível {currentLevel + 1}</span>
            </div>
            
            <Progress value={progressToNextLevel} className="h-3" />
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{user?.points || 0} pontos acumulados</span>
              <span className="text-gray-600">Faltam {pointsToNextLevel} pontos</span>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <h4 className="font-medium text-gray-800 mb-3">Distribuição de Pontos</h4>
              <div className="space-y-3">
                {isLoading ? (
                  // Mostrar placeholders de carregamento
                  <>
                    {[1, 2, 3].map(index => (
                      <div key={index} className="animate-pulse">
                        <div className="flex justify-between text-sm mb-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-4 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2"></div>
                      </div>
                    ))}
                  </>
                ) : pointsBreakdown.length === 0 ? (
                  // Mostrar mensagem quando não há dados
                  <div className="text-center py-3 text-gray-500">
                    Nenhum ponto registrado ainda
                  </div>
                ) : (
                  // Mostrar dados reais
                  pointsBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.category}</span>
                        <span>{item.points} pts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full transition-all duration-500 ease-in-out" 
                          style={{ 
                            width: `${Math.min((item.points / (pointsBreakdown.reduce((sum, current) => sum + current.points, 0) || 1)) * 100, 100)}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Pontuação Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="text-5xl font-bold text-robbialac mb-6">{user?.points || 0}</div>
            <div className="text-center space-y-2">
              <p className="font-medium">Nível {currentLevel}</p>
              <p className="text-sm text-gray-600">
                {isLoading ? (
                  <span className="animate-pulse">Carregando ranking...</span>
                ) : (
                  `Ranking: #${userRanking.position} de ${userRanking.totalUsers}`
                )}
              </p>
              <Button className="mt-4 w-full bg-robbialac hover:bg-robbialac-dark">
                Ver Ranking Completo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
  
  const medalsTab = (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-bold mb-6">Medalhas Conquistadas</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : medals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sem medalhas ainda</h3>
            <p className="mt-1 text-sm text-gray-500">Complete atividades de segurança para ganhar medalhas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {medals.map((medal) => (
              <MedalCard 
                key={medal.id} 
                medal={medal} 
                isAcquired={true} 
                userPoints={user?.points || 0} 
              />
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-6">Próximas Conquistas</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : unacquiredMedals.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Parabéns!</h3>
            <p className="mt-1 text-sm text-gray-500">Você conquistou todas as medalhas disponíveis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {unacquiredMedals.map((medal) => (
              <MedalCard 
                key={medal.id} 
                medal={medal} 
                isAcquired={false} 
                userPoints={user?.points || 0} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  const historyTab = (
    <div>
      <h2 className="text-2xl font-bold mb-6">Histórico de Atividades</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-start p-4 border border-gray-100 rounded-lg shadow-sm bg-white animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sem atividades recentes</h3>
          <p className="mt-1 text-sm text-gray-500">Suas atividades aparecerão aqui quando você começar a interagir com a plataforma.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start p-4 border border-gray-100 rounded-lg shadow-sm bg-white">
              <div className="mr-4 mt-1">{getTypeIcon(activity.category)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{activity.description}</div>
                    <div className="text-sm text-gray-500">
                      {format(parseISO(activity.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-gray-100 rounded text-sm font-medium text-gray-800">
                    +{activity.points} pts
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  const tabsSection = (
    <Tabs defaultValue="medals" className="mb-8">
      <TabsList className="mb-6">
        <TabsTrigger value="medals" className="px-6">Medalhas</TabsTrigger>
        <TabsTrigger value="history" className="px-6">Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="medals">
        {medalsTab}
      </TabsContent>
      <TabsContent value="history">
        {historyTab}
      </TabsContent>
    </Tabs>
  );
  
  const pointsSystemSection = (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sistema de Pontuação</CardTitle>
        <CardDescription>Como ganhar pontos na plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">Assistir Vídeos</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• Vídeos de Segurança: 50 pts</li>
              <li>• Vídeos de Qualidade: 50 pts</li>
              <li>• Vídeos de Procedimentos: 50 pts</li>
              <li>• Formação Completa: +100 pts</li>
            </ul>
          </div>
          
          <div className="p-4 bg-orange-50 rounded-lg">
            <h3 className="font-medium text-orange-800 mb-2">Reportar Quase Acidentes</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• Severidade Baixa: 50 pts</li>
              <li>• Severidade Média: 75 pts</li>
              <li>• Severidade Alta: 100 pts</li>
              <li>• Com evidência fotográfica: +25 pts</li>
            </ul>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Conquistas e Bônus</h3>
            <ul className="text-sm space-y-2 text-gray-700">
              <li>• Nova Medalha: 100 pts</li>
              <li>• Primeiro da semana: 50 pts</li>
              <li>• Sequência de 5 dias: 75 pts</li>
              <li>• Completar área: 200 pts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  // Conditional rendering based on view mode
  const pageContent = isCompactView ? (
    <NoScrollLayout 
      sections={[headerSection, progressSection, tabsSection, pointsSystemSection]} 
      showPagination={true}
    />
  ) : (
    <>
      {headerSection}
      {progressSection}
      {tabsSection}
      {pointsSystemSection}
    </>
  );
  
  return (
    <Layout>
      {pageContent}
    </Layout>
  );
}
