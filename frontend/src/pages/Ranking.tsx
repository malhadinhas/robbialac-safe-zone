import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { getLeaderboard, LeaderboardEntry } from "@/services/statsService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award, ArrowLeft } from "lucide-react"; // Ícones
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Ranking() {
  const navigate = useNavigate(); // Initialize navigate

  const { data: leaderboardData, isLoading, error } = useQuery<LeaderboardEntry[]>({ // Especificar o tipo aqui
    queryKey: ["leaderboard"],
    queryFn: getLeaderboard
  });

  return (
    <Layout>
      <div className="py-6 space-y-6 max-w-5xl mx-auto bg-[#f7faff] min-h-screen flex flex-col items-center justify-start">
        <div className="flex items-center justify-between mb-4 w-full max-w-5xl px-2 sm:px-6">
          <h1 className="text-3xl font-bold text-gray-900">Classificação Geral</h1>
          <Button 
            variant="default"
            className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
        <Card className="shadow-xl rounded-2xl border border-gray-100 w-full max-w-5xl">
          <CardHeader className="bg-gray-50 rounded-t-2xl border-b border-gray-100">
            <CardTitle className="text-xl font-bold text-gray-800">Classificação dos Utilizadores</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="text-center py-8">A carregar classificação...</div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">Erro ao carregar o ranking. Tente novamente mais tarde.</div>
            ) : !leaderboardData || leaderboardData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum utilizador encontrado para exibir no ranking.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-[80px]">Posição</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Utilizador</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Pontos</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Medalhas</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Melhores Medalhas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {leaderboardData.map((user, index) => (
                      <tr
                        key={user._id}
                        className={
                          index < 3
                            ? index === 0
                              ? "bg-yellow-50/80"
                              : index === 1
                              ? "bg-gray-50/80"
                              : "bg-orange-50/80"
                            : index % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        }
                      >
                        <td className="font-medium text-center px-4 py-3">
                          {user.rank === 1 ? (
                            <Trophy className="inline-block h-6 w-6 text-yellow-500" title="1º lugar" />
                          ) : user.rank === 2 ? (
                            <Trophy className="inline-block h-6 w-6 text-gray-400" title="2º lugar" />
                          ) : user.rank === 3 ? (
                            <Trophy className="inline-block h-6 w-6 text-orange-400" title="3º lugar" />
                          ) : (
                            <span className="text-lg font-bold text-gray-500">{user.rank}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-left font-semibold text-gray-800">{user.name}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{user.points}</td>
                        <td className="px-4 py-3 text-center text-gray-700">{user.medalCount}</td>
                        <td className="px-4 py-3">
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 