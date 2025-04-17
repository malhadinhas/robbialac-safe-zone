import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { getLeaderboard, LeaderboardEntry } from "@/services/statsService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award } from "lucide-react"; // Ícones

export default function Ranking() {

  const { data: leaderboardData, isLoading, error } = useQuery<LeaderboardEntry[]>({ // Especificar o tipo aqui
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard
  });

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <h1 className="text-3xl font-bold">Classificação Geral</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Classificação dos Utilizadores</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">A carregar classificação...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Erro ao carregar o ranking. Tente novamente mais tarde.</div>
            ) : !leaderboardData || leaderboardData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum utilizador encontrado para exibir no ranking.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px] text-center">Posição</TableHead>
                    <TableHead>Utilizador</TableHead>
                    <TableHead className="text-right">Pontos</TableHead>
                    <TableHead className="text-center">Medalhas</TableHead>
                    <TableHead>Melhores Medalhas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{leaderboardData.map((user, index) => (
                  <TableRow key={user._id} className={index < 3 ? "bg-yellow-50/50" : ""}>
                    <TableCell className="font-medium text-center">
                      {user.rank === 1 ? <Trophy className="inline-block h-5 w-5 text-yellow-500"/> 
                        : user.rank === 2 ? <Trophy className="inline-block h-5 w-5 text-gray-400"/>
                        : user.rank === 3 ? <Trophy className="inline-block h-5 w-5 text-orange-400"/>
                        : user.rank}
                    </TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell className="text-right font-semibold">{user.points}</TableCell>
                    <TableCell className="text-center">
                      {user.medalCount}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {user.topMedals && user.topMedals.length > 0 ? (
                          user.topMedals.map((medal) => (
                            <img 
                              key={medal.name}
                              src={medal.imageSrc || "https://placeholder.pics/svg/32/CCCCCC/666666/M"}
                              alt={medal.name}
                              title={medal.name}
                              className="h-6 w-6 rounded-full object-contain border border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://placeholder.pics/svg/32/CCCCCC/666666/M";
                              }}
                            />
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 