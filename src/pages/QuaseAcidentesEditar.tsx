
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIncidentById, updateIncident } from "@/services/incidentService";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import { Incident } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface FormIncidentData {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  date?: string;
  severity?: "Baixo" | "Médio" | "Alto";
  status?: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  department?: string;
  implementedAction?: string;
  responsible?: string;
  adminNotes?: string;
  suggestionToFix?: string;
  resolutionDeadline?: string;
  reportedBy?: string;
  pointsAwarded?: number;
  factoryArea?: string;
  frequencyValue?: number;
  frequency?: "Baixa" | "Moderada" | "Alta";
  gravityValue?: number;
  risk?: number;
  qaQuality?: "Baixa" | "Média" | "Alta";
  resolutionDays?: number;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string | null;
}

// Define the list of available departments
const DEPARTMENTS = [
  "Operações",
  "Qualidade",
  "Manutenção",
  "Logística",
  "Produção",
  "Administrativo",
  "Engenharia",
  "Segurança"
];

// Frequency mapping
const FREQUENCY_VALUES = {
  "Baixa": 2,
  "Moderada": 6,
  "Alta": 8
};

// Gravity mapping
const GRAVITY_VALUES = {
  "Baixo": 1,
  "Médio": 4,
  "Alto": 7
};

// Resolution days options
const RESOLUTION_DAYS_OPTIONS = [30, 60, 90];

export const QuaseAcidentesEditModal = ({ isOpen, onClose, incidentId }: EditModalProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormIncidentData>({});
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if user has admin privileges
  const isAdmin = user?.role === "admin_qa" || user?.role === "admin_app";
  console.log("User role:", user?.role, "isAdmin:", isAdmin);

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentById(incidentId || ""),
    enabled: !!incidentId
  });

  useEffect(() => {
    if (incident) {
      console.log("Incident data loaded:", incident);
      setFormData({
        id: incident.id,
        title: incident.title,
        description: incident.description,
        location: incident.location,
        date: incident.date instanceof Date ? incident.date.toISOString().split('T')[0] : new Date(incident.date).toISOString().split('T')[0],
        severity: incident.severity,
        status: incident.status,
        department: incident.department,
        implementedAction: incident.implementedAction || "",
        responsible: incident.responsible || "",
        adminNotes: incident.adminNotes || "",
        suggestionToFix: incident.suggestionToFix || "",
        resolutionDeadline: incident.resolutionDeadline ? (incident.resolutionDeadline instanceof Date ? incident.resolutionDeadline.toISOString().split('T')[0] : new Date(incident.resolutionDeadline).toISOString().split('T')[0]) : "",
        reportedBy: incident.reportedBy,
        pointsAwarded: incident.pointsAwarded,
        factoryArea: incident.factoryArea || "",
        frequency: incident.frequency || "Baixa",
        frequencyValue: incident.frequencyValue || FREQUENCY_VALUES["Baixa"],
        gravityValue: incident.gravityValue || GRAVITY_VALUES[incident.severity as keyof typeof GRAVITY_VALUES] || 1,
        risk: incident.risk || (incident.frequencyValue || 2) * (incident.gravityValue || 1),
        qaQuality: incident.qaQuality || "Baixa",
        resolutionDays: incident.resolutionDays || 30
      });
      
      if (incident.images) {
        setImages(incident.images);
      }
    }
  }, [incident]);

  useEffect(() => {
    // Calculate risk when frequency or gravity changes
    if (formData.frequencyValue && formData.gravityValue) {
      const risk = formData.frequencyValue * formData.gravityValue;
      setFormData(prev => ({ ...prev, risk }));
      
      // Automatically determine QA Quality based on risk value
      let qaQuality: "Baixa" | "Média" | "Alta" = "Baixa";
      if (risk > 24) {
        qaQuality = "Alta";
      } else if (risk >= 8) {
        qaQuality = "Média";
      }
      
      setFormData(prev => ({ ...prev, qaQuality }));
    }
  }, [formData.frequencyValue, formData.gravityValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`Select change: ${name} = ${value}`);
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Handle frequency and gravity special cases to set their values
    if (name === "frequency") {
      setFormData(prev => ({ 
        ...prev, 
        frequencyValue: FREQUENCY_VALUES[value as keyof typeof FREQUENCY_VALUES] || 2
      }));
    }
    
    if (name === "severity") {
      setFormData(prev => ({ 
        ...prev, 
        gravityValue: GRAVITY_VALUES[value as keyof typeof GRAVITY_VALUES] || 1
      }));
    }

    if (name === "resolutionDays") {
      setFormData(prev => ({ 
        ...prev, 
        resolutionDays: parseInt(value, 10)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.severity || !formData.status) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const updatedIncident: Incident = {
        ...incident!,
        ...formData as any,
        date: new Date(formData.date as string),
        resolutionDeadline: formData.resolutionDeadline ? new Date(formData.resolutionDeadline) : undefined,
        images: images
      } as Incident;
      
      await updateIncident(updatedIncident);
      toast.success("Quase acidente atualizado com sucesso");
      onClose();
    } catch (error) {
      console.error("Error updating incident:", error);
      toast.error("Erro ao atualizar quase acidente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-6 overflow-auto bg-white text-black" style={{width: '90%', maxHeight: '90vh', zIndex: 99999}}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Editar Quase Acidente</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-lg">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coluna 1: Informações básicas */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    rows={3}
                    required
                    className="resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Local <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium mb-1">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date || ""}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-1">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleSelectChange("department", value)}
                    >
                      <SelectTrigger id="department" className="bg-white">
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[99999]">
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="factoryArea" className="block text-sm font-medium mb-1">
                      Área da Fábrica
                    </label>
                    <Input
                      id="factoryArea"
                      name="factoryArea"
                      value={formData.factoryArea || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Coluna 2: Status e detalhes  */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="severity" className="block text-sm font-medium mb-1">
                      Gravidade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => handleSelectChange("severity", value)}
                    >
                      <SelectTrigger id="severity" className="bg-white">
                        <SelectValue placeholder="Gravidade" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[99999]">
                        <SelectItem value="Baixo">Baixo (1)</SelectItem>
                        <SelectItem value="Médio">Médio (4)</SelectItem>
                        <SelectItem value="Alto">Alto (7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status" className="bg-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-[99999]">
                        <SelectItem value="Reportado">Reportado</SelectItem>
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                        <SelectItem value="Arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="frequency" className="block text-sm font-medium mb-1">
                          Frequência
                        </label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value) => handleSelectChange("frequency", value)}
                        >
                          <SelectTrigger id="frequency" className="bg-white">
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-[99999]">
                            <SelectItem value="Baixa">Baixa (2)</SelectItem>
                            <SelectItem value="Moderada">Moderada (6)</SelectItem>
                            <SelectItem value="Alta">Alta (8)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor="resolutionDays" className="block text-sm font-medium mb-1">
                          Dias para Resolução
                        </label>
                        <Select
                          value={formData.resolutionDays?.toString()}
                          onValueChange={(value) => handleSelectChange("resolutionDays", value)}
                        >
                          <SelectTrigger id="resolutionDays" className="bg-white">
                            <SelectValue placeholder="Selecione os dias" />
                          </SelectTrigger>
                          <SelectContent className="bg-white z-[99999]">
                            {RESOLUTION_DAYS_OPTIONS.map((days) => (
                              <SelectItem key={days} value={days.toString()}>
                                {days} dias
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Valor da Frequência
                        </label>
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded flex items-center px-3">
                          <span>{formData.frequencyValue || 0}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Valor da Gravidade
                        </label>
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded flex items-center px-3">
                          <span>{formData.gravityValue || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Risco Calculado
                        </label>
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded flex items-center px-3">
                          <span>{formData.risk || 0}</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Qualidade QA
                        </label>
                        <div className="h-10 bg-gray-100 border border-gray-300 rounded flex items-center px-3">
                          <span>{formData.qaQuality || "Baixa"}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label htmlFor="suggestionToFix" className="block text-sm font-medium mb-1">
                    Sugestão de Correção
                  </label>
                  <Textarea
                    id="suggestionToFix"
                    name="suggestionToFix"
                    value={formData.suggestionToFix || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="responsible" className="block text-sm font-medium mb-1">
                  Responsável
                </label>
                <Input
                  id="responsible"
                  name="responsible"
                  value={formData.responsible || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label htmlFor="resolutionDeadline" className="block text-sm font-medium mb-1">
                  Prazo para Resolução
                </label>
                <Input
                  id="resolutionDeadline"
                  name="resolutionDeadline"
                  type="date"
                  value={formData.resolutionDeadline || ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="implementedAction" className="block text-sm font-medium mb-1">
                Ação Implementada
              </label>
              <Textarea
                id="implementedAction"
                name="implementedAction"
                value={formData.implementedAction || ""}
                onChange={handleInputChange}
                rows={3}
                className="resize-none"
              />
            </div>
            
            <div>
              <label htmlFor="adminNotes" className="block text-sm font-medium mb-1">
                Notas Administrativas
              </label>
              <Textarea
                id="adminNotes"
                name="adminNotes"
                value={formData.adminNotes || ""}
                onChange={handleInputChange}
                rows={3}
                className="resize-none"
              />
            </div>
            
            {/* Images section - simplified */}
            <div>
              <p className="text-sm font-medium">Imagens ({images.length})</p>
              {images.length > 0 && (
                <div className="grid grid-cols-6 gap-2 mt-2">
                  {images.slice(0, 6).map((image, index) => (
                    <div key={index} className="h-12 w-12">
                      <img 
                        src={image} 
                        alt={`Imagem ${index + 1}`} 
                        className="h-full w-full object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <DialogFooter className="pt-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-robbialac hover:bg-robbialac-dark"
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Legacy component for compatibility - redirects to the main page
const QuaseAcidentesEditar = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate("/quase-acidentes");
  }, [navigate]);
  
  return (
    <Layout>
      <div className="container p-4">
        <p>Redirecionando...</p>
      </div>
    </Layout>
  );
};

export default QuaseAcidentesEditar;
