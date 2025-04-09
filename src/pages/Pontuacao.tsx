
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { mockMedals } from "@/services/mockData";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Pontuacao() {
  const { user } = useAuth();
  
  // Cálculo da próxima medalha e progresso
  const earnedMedals = mockMedals.filter(medal => medal.acquired);
  const unearnedMedals = mockMedals.filter(medal => !medal.acquired);
  
  // Progress para o próximo nível
  const progressToNextLevel = Math.min(((user?.points || 0) % 500) / 5, 100);
  const currentLevel = user?.level || 1;
  const pointsToNextLevel = 500 - ((user?.points || 0) % 500);
  
  const pointsBreakdown = [
    { category: "Vídeos Assistidos", points: 250, color: "#0071CE" },
    { category: "Quase Acidentes", points: 175, color: "#FF7A00" },
    { category: "Formações Concluídas", points: 75, color: "#28a745" }
  ];
  
  const activityHistory = [
    { 
      id: "1", 
      description: "Completou formação: 'Segurança no Enchimento'", 
      date: new Date("2024-04-01"), 
      points: 50,
      type: "formacao"
    },
    { 
      id: "2", 
      description: "Reportou quase acidente: 'Derrame de solvente'", 
      date: new Date("2024-03-25"), 
      points: 75,
      type: "incidente"
    },
    { 
      id: "3", 
      description: "Medalha desbloqueada: 'Vigilante da Segurança'", 
      date: new Date("2024-03-15"), 
      points: 100,
      type: "medalha"
    },
    { 
      id: "4", 
      description: "Assistiu 5 vídeos de segurança", 
      date: new Date("2024-03-10"), 
      points: 100,
      type: "video"
    },
    { 
      id: "5", 
      description: "Reportou quase acidente: 'Painel elétrico aberto'", 
      date: new Date("2024-02-28"), 
      points: 100,
      type: "incidente"
    }
  ];
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'formacao':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-green-600">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        );
      case 'incidente':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
              className="text-orange-500">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'medalha':
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
  
  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Sua Pontuação</h1>
        <p className="text-gray-600">Acompanhe seu progresso e conquistas</p>
      </div>
      
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
                  {pointsBreakdown.map((item, index) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.category}</span>
                        <span>{item.points} pts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            width: `${(item.points / (user?.points || 1)) * 100}%`,
                            backgroundColor: item.color 
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
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
                <p className="text-sm text-gray-600">Ranking: #12 de 50</p>
                <Button className="mt-4 w-full bg-robbialac hover:bg-robbialac-dark">
                  Ver Ranking Completo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="medals" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="medals" className="px-6">Medalhas</TabsTrigger>
          <TabsTrigger value="history" className="px-6">Histórico</TabsTrigger>
        </TabsList>
        
        <TabsContent value="medals">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Medalhas Conquistadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedMedals.map((medal) => (
                <Card key={medal.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-yellow-300">
                  <CardContent className="p-6 flex items-center">
                    <div className="text-5xl mr-4">{medal.image}</div>
                    <div>
                      <h3 className="font-bold text-lg">{medal.name}</h3>
                      <p className="text-gray-600 text-sm">{medal.description}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Conquistada em {medal.acquiredDate && format(new Date(medal.acquiredDate), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold mb-4">Próximas Conquistas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unearnedMedals.map((medal) => (
                <Card key={medal.id} className="bg-gray-50 opacity-80">
                  <CardContent className="p-6 flex items-center">
                    <div className="text-5xl mr-4 opacity-50">{medal.image}</div>
                    <div>
                      <h3 className="font-bold text-lg">{medal.name}</h3>
                      <p className="text-gray-600 text-sm">{medal.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
              <CardDescription>Suas ações e pontos ganhos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activityHistory.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div className="bg-gray-100 p-2 rounded-full mr-4 mt-1">
                      {getTypeIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{activity.description}</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(activity.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                        </div>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded">
                          +{activity.points} pts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
    </Layout>
  );
}
