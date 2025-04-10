import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockIncidents, mockStatsBySeverity, mockDepartments, mockSystemConfig } from "@/services/mockData";
import { 
  AlertCircle, FileUp, FileDown, FileSpreadsheet, Calendar,
  CheckCircle, Clock, User, ChartBar, PlusCircle, Edit, Trash2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Incident, Department, SystemConfig } from "@/types";
import { toast } from "sonner";
import { formatDistanceToNow, format } from 'date-fns';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie
} from 'recharts';
import DepartmentAnalyticsChart from "@/components/incidents/DepartmentAnalyticsChart";
import ChatbotModal from "@/components/incidents/ChatbotModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const formSchema = z.object({
  status: z.string(),
  implementedAction: z.string().optional(),
  responsible: z.string().optional(),
  frequency: z.string().optional(),
  gravityValue: z.string().optional(),
  completionDate: z.string().optional(),
  resolutionDeadline: z.string().optional(),
  adminNotes: z.string().optional(),
  department: z.string().optional(),
});

export default function QuaseAcidentes() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>(mockSystemConfig);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const [activeIncidentIndex, setActiveIncidentIndex] = useState(0);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "Reportado",
      implementedAction: "",
      responsible: "",
      frequency: "Baixa",
      gravityValue: "1",
      adminNotes: "",
      department: "",
    },
  });
  
  useEffect(() => {
    setIsAdmin(user?.role === 'admin_app' || user?.role === 'admin_qa');
  }, [user]);
  
  useEffect(() => {
    if (selectedIncidentId) {
      const incident = incidents.find(inc => inc.id === selectedIncidentId);
      if (incident) {
        form.reset({
          status: incident.status,
          implementedAction: incident.implementedAction || "",
          responsible: incident.responsible || "",
          frequency: incident.frequency || "Baixa",
          gravityValue: incident.gravityValue?.toString() || "1",
          completionDate: incident.completionDate ? format(new Date(incident.completionDate), 'yyyy-MM-dd') : "",
          resolutionDeadline: incident.resolutionDeadline ? format(new Date(incident.resolutionDeadline), 'yyyy-MM-dd') : "",
          adminNotes: incident.adminNotes || "",
          department: incident.department || "",
        });
      }
    }
  }, [selectedIncidentId, incidents, form]);
  
  const handleNewIncidentReport = () => {
    setIsModalOpen(true);
  };
  
  const handleSubmitIncident = (incident: Incident) => {
    setIncidents(prev => [incident, ...prev]);
    toast.success(`Quase acidente reportado! +${incident.pointsAwarded} pontos`);
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
    setSelectedIncidentId(id);
    setIsEditModalOpen(true);
  };
  
  const onSubmitEdit = (values: z.infer<typeof formSchema>) => {
    if (!selectedIncidentId) return;
    
    const updatedIncidents = incidents.map(incident => {
      if (incident.id === selectedIncidentId) {
        const gravityValue = parseInt(values.gravityValue || "1");
        const frequencyValue = values.frequency === "Alta" ? 8 : values.frequency === "Moderada" ? 6 : 2;
        const risk = gravityValue * frequencyValue;
        
        let qaQuality: "Baixa" | "Média" | "Alta" = "Baixa";
        if (risk > 24) qaQuality = "Alta";
        else if (risk >= 8) qaQuality = "Média";
        else qaQuality = "Baixa";
        
        const resolutionDays = qaQuality === "Alta" ? 7 : qaQuality === "Média" ? 14 : 30;
        
        let resolutionDeadline = incident.resolutionDeadline;
        if (!resolutionDeadline) {
          const newDeadline = new Date();
          newDeadline.setDate(newDeadline.getDate() + resolutionDays);
          resolutionDeadline = newDeadline;
        } else if (values.resolutionDeadline) {
          resolutionDeadline = new Date(values.resolutionDeadline);
        }
        
        return {
          ...incident,
          status: values.status as Incident["status"],
          adminNotes: values.adminNotes,
          implementedAction: values.implementedAction,
          responsible: values.responsible,
          frequency: values.frequency as "Baixa" | "Moderada" | "Alta",
          frequencyValue,
          gravityValue,
          risk,
          qaQuality,
          resolutionDays,
          resolutionDeadline,
          completionDate: values.completionDate ? new Date(values.completionDate) : undefined,
          department: values.department || incident.department,
        };
      }
      return incident;
    });
    
    setIncidents(updatedIncidents);
    toast.success("Quase acidente atualizado com sucesso!");
    setIsEditModalOpen(false);
  };
  
  const handleUpdateDepartments = (updatedDepartments: Department[]) => {
    setDepartments(updatedDepartments);
  };

  const handleUpdateSystemConfig = (updatedConfig: SystemConfig) => {
    setSystemConfig(updatedConfig);
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
  
  const getQAQualityColor = (quality?: string) => {
    switch (quality) {
      case "Alta": return "bg-red-100 text-red-800";
      case "Média": return "bg-orange-100 text-orange-800";
      case "Baixa": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.success(`Arquivo "${file.name}" importado com sucesso!`);
      setIsImportDialogOpen(false);
    }
  };
  
  const handleExportExcel = () => {
    toast.success("Dados exportados para Excel com sucesso!");
    setIsExportDialogOpen(false);
  };
  
  const handleExportAnalytics = () => {
    toast.success("Relatórios analíticos exportados com sucesso!");
    setIsExportDialogOpen(false);
  };

  const frequencyData = [
    { name: "Baixa", value: incidents.filter(i => i.frequency === "Baixa").length, color: "#4CAF50" },
    { name: "Moderada", value: incidents.filter(i => i.frequency === "Moderada").length, color: "#FFA726" },
    { name: "Alta", value: incidents.filter(i => i.frequency === "Alta").length, color: "#F44336" },
  ];

  const riskData = [
    { name: "1-8", value: incidents.filter(i => i.risk !== undefined && i.risk <= 8).length, color: "#4CAF50" },
    { name: "9-16", value: incidents.filter(i => i.risk !== undefined && i.risk > 8 && i.risk <= 16).length, color: "#FFC107" },
    { name: "17-24", value: incidents.filter(i => i.risk !== undefined && i.risk > 16 && i.risk <= 24).length, color: "#FF9800" },
    { name: "25+", value: incidents.filter(i => i.risk !== undefined && i.risk > 24).length, color: "#F44336" },
  ];

  const getMonthlyData = () => {
    const currentYear = new Date().getFullYear();
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const monthData = months.map((month, index) => {
      const monthIncidents = incidents.filter(incident => {
        const date = new Date(incident.date);
        return date.getMonth() === index && date.getFullYear() === currentYear;
      });
      
      const baixo = monthIncidents.filter(i => i.severity === "Baixo").length;
      const medio = monthIncidents.filter(i => i.severity === "Médio").length;
      const alto = monthIncidents.filter(i => i.severity === "Alto").length;
      
      return {
        month,
        baixo,
        medio,
        alto,
        total: baixo + medio + alto
      };
    });
    
    return monthData;
  };

  const monthlyData = getMonthlyData();
  
  const nextIncident = () => {
    if (incidents.length === 0) return;
    setActiveIncidentIndex((prev) => (prev + 1) % incidents.length);
  };
  
  const prevIncident = () => {
    if (incidents.length === 0) return;
    setActiveIncidentIndex((prev) => (prev - 1 + incidents.length) % incidents.length);
  };

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quase Acidentes</h1>
        <p className="text-gray-600">Visualize, reporte e acompanhe situações de risco</p>
      </div>
      
      <div className="flex flex-col gap-4 mb-6">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {isAdmin && (
            <>
              <Button 
                variant="outline" 
                className="flex items-center bg-white"
                onClick={() => setIsImportDialogOpen(true)}
                size="ultra-responsive"
                shortText="Importar"
                iconOnly={isMobile}
                fullWidth={isMobile}
              >
                <FileUp className="h-5 w-5" />
                Importar
              </Button>
              <Button 
                variant="outline" 
                className="flex items-center bg-white"
                onClick={() => setIsExportDialogOpen(true)}
                size="ultra-responsive"
                shortText="Exportar"
                iconOnly={isMobile}
                fullWidth={isMobile}
              >
                <FileDown className="h-5 w-5" />
                Exportar
              </Button>
            </>
          )}
        </div>
        <div>
          <Button 
            onClick={handleNewIncidentReport} 
            className="bg-robbialac hover:bg-robbialac-dark flex items-center"
            size={isMobile ? "ultra-responsive" : "responsive"}
            fullWidth={true}
            shortText="Reportar"
          >
            <PlusCircle className="h-5 w-5" />
            Reportar Quase Acidente
          </Button>
        </div>
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
            {isMobile || window.innerWidth < 768 ? (
              incidents.length > 0 ? (
                <div className="relative pb-10">
                  <Card 
                    key={incidents[activeIncidentIndex].id}
                    className={`border-l-4 ${getSeverityColor(incidents[activeIncidentIndex].severity)}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{incidents[activeIncidentIndex].title}</CardTitle>
                          <div className="text-sm text-gray-500 mt-1">
                            Reportado por {incidents[activeIncidentIndex].reportedBy.split('@')[0]} • {' '}
                            {formatDistanceToNow(new Date(incidents[activeIncidentIndex].date), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incidents[activeIncidentIndex].status)}`}>
                            {incidents[activeIncidentIndex].status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            incidents[activeIncidentIndex].severity === "Alto" 
                              ? "bg-red-100 text-red-800" 
                              : incidents[activeIncidentIndex].severity === "Médio"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {incidents[activeIncidentIndex].severity}
                          </span>
                          {incidents[activeIncidentIndex].qaQuality && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQAQualityColor(incidents[activeIncidentIndex].qaQuality)}`}>
                              QA: {incidents[activeIncidentIndex].qaQuality}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3">{incidents[activeIncidentIndex].description}</p>
                      
                      <div className="text-sm text-gray-600 mb-2 grid grid-cols-1 gap-2">
                        <div><strong>Local:</strong> {incidents[activeIncidentIndex].location}</div>
                        
                        {incidents[activeIncidentIndex].department && (
                          <div><strong>Departamento:</strong> {incidents[activeIncidentIndex].department}</div>
                        )}
                        
                        {incidents[activeIncidentIndex].responsible && (
                          <div><strong>Responsável:</strong> {incidents[activeIncidentIndex].responsible}</div>
                        )}
                        
                        {incidents[activeIncidentIndex].resolutionDeadline && (
                          <div className="flex items-center">
                            <Calendar className="inline h-4 w-4 mr-1 text-gray-500" />
                            <strong>Prazo resolução:</strong> {format(new Date(incidents[activeIncidentIndex].resolutionDeadline), 'dd/MM/yyyy')}
                          </div>
                        )}
                        
                        {incidents[activeIncidentIndex].completionDate && (
                          <div className="flex items-center">
                            <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" />
                            <strong>Data Conclusão:</strong> {format(new Date(incidents[activeIncidentIndex].completionDate), 'dd/MM/yyyy')}
                          </div>
                        )}
                        
                        {incidents[activeIncidentIndex].frequency && (
                          <div><strong>Frequência:</strong> {incidents[activeIncidentIndex].frequency}</div>
                        )}
                        
                        {incidents[activeIncidentIndex].risk !== undefined && (
                          <div><strong>Risco:</strong> {incidents[activeIncidentIndex].risk}</div>
                        )}
                        
                        {incidents[activeIncidentIndex].resolutionDays !== undefined && (
                          <div className="flex items-center">
                            <Clock className="inline h-4 w-4 mr-1 text-gray-500" />
                            <strong>Dias resolução:</strong> {incidents[activeIncidentIndex].resolutionDays}
                          </div>
                        )}
                      </div>
                      
                      {incidents[activeIncidentIndex].implementedAction && (
                        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                          <p className="text-sm font-medium text-green-800">Ação implementada:</p>
                          <p className="text-sm text-gray-700">{incidents[activeIncidentIndex].implementedAction}</p>
                        </div>
                      )}
                      
                      {incidents[activeIncidentIndex].adminNotes && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <p className="text-sm font-medium text-blue-800">Nota do administrador:</p>
                          <p className="text-sm text-gray-700">{incidents[activeIncidentIndex].adminNotes}</p>
                        </div>
                      )}
                      
                      {isAdmin && (
                        <div className="mt-4 pt-4 border-t flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditIncident(incidents[activeIncidentIndex].id)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:border-red-200"
                            onClick={() => handleDeleteIncident(incidents[activeIncidentIndex].id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Apagar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center gap-2 mt-4 pb-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={prevIncident}
                      className="rounded-full"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-500">
                      {activeIncidentIndex + 1} / {incidents.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextIncident}
                      className="rounded-full"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
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
              )
            ) : (
              <>
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
                          {incident.qaQuality && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQAQualityColor(incident.qaQuality)}`}>
                              QA: {incident.qaQuality}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-3">{incident.description}</p>
                      
                      <div className="text-sm text-gray-600 mb-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div><strong>Local:</strong> {incident.location}</div>
                        
                        {incident.department && (
                          <div><strong>Departamento:</strong> {incident.department}</div>
                        )}
                        
                        {incident.responsible && (
                          <div><strong>Responsável:</strong> {incident.responsible}</div>
                        )}
                        
                        {incident.resolutionDeadline && (
                          <div className="flex items-center">
                            <Calendar className="inline h-4 w-4 mr-1 text-gray-500" />
                            <strong>Prazo resolução:</strong> {format(new Date(incident.resolutionDeadline), 'dd/MM/yyyy')}
                          </div>
                        )}
                        
                        {incident.completionDate && (
                          <div className="flex items-center">
                            <CheckCircle className="inline h-4 w-4 mr-1 text-green-500" />
                            <strong>Data Conclusão:</strong> {format(new Date(incident.completionDate), 'dd/MM/yyyy')}
                          </div>
                        )}
                        
                        {incident.frequency && (
                          <div><strong>Frequência:</strong> {incident.frequency}</div>
                        )}
                        
                        {incident.risk !== undefined && (
                          <div><strong>Risco:</strong> {incident.risk}</div>
                        )}
                        
                        {incident.resolutionDays !== undefined && (
                          <div className="flex items-center">
                            <Clock className="inline h-4 w-4 mr-1 text-gray-500" />
                            <strong>Dias resolução:</strong> {incident.resolutionDays}
                          </div>
                        )}
                      </div>
                      
                      {incident.implementedAction && (
                        <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                          <p className="text-sm font-medium text-green-800">Ação implementada:</p>
                          <p className="text-sm text-gray-700">{incident.implementedAction}</p>
                        </div>
                      )}
                      
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
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="estatisticas">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="md:col-span-2 bg-white shadow">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Análise de Quase Acidentes</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden pb-6">
                <Tabs defaultValue="departamento" className="w-full">
                  <TabsList variant="fitted" className="mb-4 w-full justify-start">
                    <TabsTrigger variant="fitted" value="departamento">Por Departamento</TabsTrigger>
                    <TabsTrigger variant="fitted" value="severidade">Por Severidade</TabsTrigger>
                    <TabsTrigger variant="fitted" value="mensal">Tendência Mensal</TabsTrigger>
                  </TabsList>
                  
                  <div className="h-[350px] mt-4">
                    <TabsContent value="departamento" className="h-full">
                      <DepartmentAnalyticsChart 
                        incidents={incidents}
                        departments={departments}
                        systemConfig={systemConfig}
                        onUpdateDepartments={handleUpdateDepartments}
                        onUpdateConfig={handleUpdateSystemConfig}
                      />
                    </TabsContent>
                    
                    <TabsContent value="severidade" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={mockStatsBySeverity}>
                          <XAxis dataKey="severity" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Quantidade">
                            {mockStatsBySeverity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="mensal" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          data={monthlyData}
                        >
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="baixo" name="Baixo" fill="#ffc107" />
                          <Bar dataKey="medio" name="Médio" fill="#fd7e14" />
                          <Bar dataKey="alto" name="Alto" fill="#dc3545" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow h-[500px]">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Distribuição de Quase Acidentes</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <Tabs defaultValue="status" className="w-full">
                  <TabsList variant="fitted" className="mb-4 w-full justify-start">
                    <TabsTrigger variant="fitted" value="status">Por Status</TabsTrigger>
                    <TabsTrigger variant="fitted" value="frequencia">Por Frequência</TabsTrigger>
                  </TabsList>
                  
                  <div className="h-[350px]">
                    <TabsContent value="status" className="h-full">
                      <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                            <span>Reportados</span>
                          </div>
                          <span className="font-medium">{incidents.filter(i => i.status === "Reportado").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                            <span>Em Análise</span>
                          </div>
                          <span className="font-medium">{incidents.filter(i => i.status === "Em Análise").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                            <span>Resolvidos</span>
                          </div>
                          <span className="font-medium">{incidents.filter(i => i.status === "Resolvido").length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                            <span>Arquivados</span>
                          </div>
                          <span className="font-medium">{incidents.filter(i => i.status === "Arquivado").length}</span>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-6 border-t">
                        <h3 className="font-medium mb-2">Tempo médio de resolução</h3>
                        <div className="text-3xl font-bold text-robbialac">3.5 dias</div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="frequencia" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={frequencyData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                          >
                            {frequencyData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow h-[500px]">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Análise de Riscos</CardTitle>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <Tabs defaultValue="tendencia" className="w-full">
                  <TabsList variant="fitted" className="mb-4 w-full justify-start">
                    <TabsTrigger variant="fitted" value="tendencia">Tendência Mensal</TabsTrigger>
                    <TabsTrigger variant="fitted" value="risco">Por Nível de Risco</TabsTrigger>
                  </TabsList>
                  
                  <div className="h-[350px]">
                    <TabsContent value="tendencia" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyData}>
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total" />
                          <Line type="monotone" dataKey="alto" stroke="#ff0000" name="Alto" />
                          <Line type="monotone" dataKey="medio" stroke="#ff9800" name="Médio" />
                          <Line type="monotone" dataKey="baixo" stroke="#ffeb3b" name="Baixo" />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>
                    
                    <TabsContent value="risco" className="h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={riskData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={(entry) => `${entry.name}: ${entry.value}`}
                          >
                            {riskData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      <ChatbotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitIncident={handleSubmitIncident}
        departments={departments}
      />
      
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
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Quase Acidente</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Reportado">Reportado</SelectItem>
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                        <SelectItem value="Arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o departamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.name} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsible"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="completionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Conclusão</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa (2)</SelectItem>
                          <SelectItem value="Moderada">Moderada (6)</SelectItem>
                          <SelectItem value="Alta">Alta (8)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gravityValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gravidade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a gravidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Baixa (1)</SelectItem>
                          <SelectItem value="4">Moderada (4)</SelectItem>
                          <SelectItem value="7">Alta (7)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="resolutionDeadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Resolução</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="implementedAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ação Implementada</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as ações implementadas para resolver o problema"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="adminNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas do Administrador</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione notas e observações"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-robbialac hover:bg-robbialac-dark">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Dados de Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Selecione um arquivo Excel (.xlsx) contendo os dados de quase acidentes para importação.
            </p>
            <div className="border-2 border-dashed rounded-md border-gray-300 p-6 text-center">
              <FileSpreadsheet className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Clique para selecionar um arquivo Excel</p>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
              />
              <Button 
                className="mt-4 bg-robbialac hover:bg-robbialac-dark"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar Arquivo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Dados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center py-8"
                onClick={handleExportExcel}
              >
                <div className="text-center">
                  <FileSpreadsheet className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Exportar para Excel</p>
                </div>
              </Button>
              
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center py-8"
                onClick={handleExportAnalytics}
              >
                <div className="text-center">
                  <ChartBar className="mx-auto h-8 w-8" />
                  <p className="mt-2 text-sm">Exportar Relatórios</p>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
