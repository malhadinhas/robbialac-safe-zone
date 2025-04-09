
import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockIncidents, mockStatsBySeverity } from "@/services/mockData";
import { AlertCircle, Send, Image, PlusCircle, Edit, Trash2, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Incident } from "@/types";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

export default function QuaseAcidentes() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{text: string, isBot: boolean}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentIncident, setCurrentIncident] = useState<Partial<Incident>>({});
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Verificar se o usuário é admin
  useEffect(() => {
    setIsAdmin(user?.role === 'admin_app' || user?.role === 'admin_qa');
  }, [user]);
  
  // Iniciar chatbot quando modal abrir
  useEffect(() => {
    if (isModalOpen) {
      setChatMessages([
        { 
          text: "Olá! Vou ajudar você a reportar um quase acidente. Para começar, qual o título ou breve descrição do ocorrido?", 
          isBot: true 
        }
      ]);
      setCurrentIncident({});
    }
  }, [isModalOpen]);
  
  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);
  
  const handleNewIncidentReport = () => {
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Adicionar mensagem do usuário ao chat
    setChatMessages(prev => [...prev, { text: newMessage, isBot: false }]);
    
    // Lógica do chatbot para perguntar os campos necessários
    const botResponse = processChatbotResponse(newMessage);
    
    setNewMessage("");
    
    // Simular resposta do chatbot após um breve delay
    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 500);
  };
  
  const processChatbotResponse = (message: string): string => {
    const lastBotMessage = [...chatMessages].reverse().find(msg => msg.isBot)?.text || "";
    
    // Fluxo de perguntas do chatbot
    if (lastBotMessage.includes("qual o título ou breve descrição")) {
      setCurrentIncident(prev => ({ ...prev, title: message }));
      return "Obrigado! Em qual local da fábrica isso aconteceu?";
    }
    
    if (lastBotMessage.includes("qual local da fábrica")) {
      setCurrentIncident(prev => ({ ...prev, location: message }));
      return "Agora, por favor descreva com mais detalhes o que aconteceu:";
    }
    
    if (lastBotMessage.includes("descreva com mais detalhes")) {
      setCurrentIncident(prev => ({ ...prev, description: message }));
      return "Qual a gravidade do quase acidente? Responda com: Baixo, Médio ou Alto";
    }
    
    if (lastBotMessage.includes("gravidade do quase acidente")) {
      const severity = message.toLowerCase().includes("alto") 
        ? "Alto" 
        : message.toLowerCase().includes("médio") || message.toLowerCase().includes("medio")
        ? "Médio" 
        : "Baixo";
      
      setCurrentIncident(prev => ({ 
        ...prev, 
        severity: severity as "Baixo" | "Médio" | "Alto",
        date: new Date(),
        reportedBy: user?.email || "",
        status: "Reportado",
        id: Date.now().toString(),
        pointsAwarded: severity === "Alto" ? 100 : severity === "Médio" ? 75 : 50
      }));
      
      // Após coletar todos os dados, criar o novo incidente
      setTimeout(() => {
        if (currentIncident.title && currentIncident.location && currentIncident.description) {
          const newIncident = currentIncident as Incident;
          setIncidents(prev => [newIncident, ...prev]);
          toast.success(`Quase acidente reportado! +${newIncident.pointsAwarded} pontos`);
          setIsModalOpen(false);
        }
      }, 1000);
      
      return "Obrigado por reportar! Seu relato é muito importante para melhorarmos a segurança. Estou processando as informações...";
    }
    
    return "Desculpe, não entendi. Pode tentar novamente?";
  };
  
  const handleDeleteIncident = (id: string) => {
    setIncidentToDelete(id);
  };
  
  const confirmDeleteIncident = () => {
    if (incidentToDelete) {
      setIncidents(prev => prev.filter(incident => incident.id !== incidentToDelete));
      toast.success("Quase acidente removido com sucesso!");
      setIncidentToDelete(null);
    }
  };
  
  const handleEditIncident = (id: string) => {
    toast.info("Funcionalidade de edição será implementada em breve.");
  };
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Alto": return "border-red-500 bg-red-50";
      case "Médio": return "border-orange-500 bg-orange-50";
      case "Baixo": return "border-yellow-400 bg-yellow-50";
      default: return "border-gray-300";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolvido": return "bg-green-100 text-green-800";
      case "Em Análise": return "bg-blue-100 text-blue-800";
      case "Reportado": return "bg-yellow-100 text-yellow-800";
      case "Arquivado": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quase Acidentes</h1>
          <p className="text-gray-600">Visualize, reporte e acompanhe situações de risco</p>
        </div>
        <Button 
          onClick={handleNewIncidentReport} 
          className="bg-robbialac hover:bg-robbialac-dark flex items-center"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Reportar Quase Acidente
        </Button>
      </div>
      
      <Tabs defaultValue="lista">
        <TabsList className="mb-6">
          <TabsTrigger value="lista" className="px-6">
            Lista de Incidentes
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="px-6">
            Estatísticas
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista">
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card 
                key={incident.id}
                className={`border-l-4 ${getSeverityColor(incident.severity)}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{incident.title}</CardTitle>
                      <div className="text-sm text-gray-500 mt-1">
                        Reportado por {incident.reportedBy.split('@')[0]} • {' '}
                        {formatDistanceToNow(new Date(incident.date), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                        {incident.status}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        incident.severity === "Alto" 
                          ? "bg-red-100 text-red-800" 
                          : incident.severity === "Médio"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {incident.severity}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-3">{incident.description}</p>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Local:</strong> {incident.location}
                  </div>
                  
                  {incident.adminNotes && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                      <p className="text-sm font-medium text-blue-800">Nota do administrador:</p>
                      <p className="text-sm text-gray-700">{incident.adminNotes}</p>
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditIncident(incident.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:border-red-200"
                        onClick={() => handleDeleteIncident(incident.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Apagar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {incidents.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum quase acidente reportado</h3>
                <p className="mt-1 text-gray-500">Reporte situações de risco para melhorar a segurança.</p>
                <div className="mt-6">
                  <Button 
                    onClick={handleNewIncidentReport}
                    className="bg-robbialac hover:bg-robbialac-dark"
                  >
                    Reportar um Quase Acidente
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Quase Acidentes por Severidade</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
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
            
            <Card className="bg-white shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Status dos Quase Acidentes</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                      <span>Reportados</span>
                    </div>
                    <span className="font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span>Em Análise</span>
                    </div>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span>Resolvidos</span>
                    </div>
                    <span className="font-medium">1</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                      <span>Arquivados</span>
                    </div>
                    <span className="font-medium">0</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-medium mb-2">Tempo médio de resolução</h3>
                  <div className="text-3xl font-bold text-robbialac">3.5 dias</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Histórico Mensal de Quase Acidentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', baixo: 2, medio: 1, alto: 0 },
                        { month: 'Fev', baixo: 1, medio: 2, alto: 1 },
                        { month: 'Mar', baixo: 3, medio: 1, alto: 0 },
                        { month: 'Abr', baixo: 2, medio: 2, alto: 1 },
                      ]}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="baixo" name="Baixo" fill="#ffc107" />
                      <Bar dataKey="medio" name="Médio" fill="#fd7e14" />
                      <Bar dataKey="alto" name="Alto" fill="#dc3545" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal de Chatbot para Reportar Quase Acidente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b bg-robbialac text-white rounded-t-lg flex justify-between items-center">
              <div className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-semibold">Reportar Quase Acidente</h2>
              </div>
              <button onClick={handleCloseModal} className="text-white">
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: '60vh' }}>
              {chatMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`mb-4 ${message.isBot ? 'flex' : 'flex justify-end'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot 
                        ? 'bg-gray-100 text-gray-800' 
                        : 'bg-robbialac text-white'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            
            <div className="p-4 border-t">
              <div className="flex items-center">
                <Button variant="outline" size="icon" className="mr-2">
                  <Image className="h-5 w-5" />
                </Button>
                <input
                  type="text"
                  className="flex-1 border rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-robbialac focus:border-transparent"
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button 
                  className="rounded-l-none bg-robbialac hover:bg-robbialac-dark"
                  onClick={handleSendMessage}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                O chatbot ajudará a coletar todas as informações necessárias
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Diálogo de confirmação para apagar incidente */}
      <AlertDialog open={!!incidentToDelete} onOpenChange={() => setIncidentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este quase acidente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteIncident}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
