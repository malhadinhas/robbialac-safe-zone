
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIncidentById, updateIncident } from "@/services/incidentService";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import { Incident } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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

export const QuaseAcidentesEditModal = ({ isOpen, onClose, incidentId }: EditModalProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormIncidentData>({});
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: incident, isLoading } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentById(incidentId || ""),
    enabled: !!incidentId
  });

  useEffect(() => {
    if (incident) {
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
        factoryArea: incident.factoryArea || ""
      });
      
      if (incident.images) {
        setImages(incident.images);
      }
    }
  }, [incident]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-4 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Editar Quase Acidente</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-lg">Carregando...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Coluna 1: Informações principais */}
              <div className="space-y-2">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-0.5">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                    required
                    className="h-8"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-0.5">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-0.5">
                      Local <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleInputChange}
                      required
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium mb-0.5">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date || ""}
                      onChange={handleInputChange}
                      required
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
              
              {/* Coluna 2: Informações adicionais */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-0.5">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.department}
                      onValueChange={(value) => handleSelectChange("department", value)}
                    >
                      <SelectTrigger id="department" className="h-8">
                        <SelectValue placeholder="Selecione um departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="factoryArea" className="block text-sm font-medium mb-0.5">
                      Área da Fábrica
                    </label>
                    <Input
                      id="factoryArea"
                      name="factoryArea"
                      value={formData.factoryArea || ""}
                      onChange={handleInputChange}
                      className="h-8"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="suggestionToFix" className="block text-sm font-medium mb-0.5">
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="responsible" className="block text-sm font-medium mb-0.5">
                      Responsável
                    </label>
                    <Input
                      id="responsible"
                      name="responsible"
                      value={formData.responsible || ""}
                      onChange={handleInputChange}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <label htmlFor="resolutionDeadline" className="block text-sm font-medium mb-0.5">
                      Prazo para Resolução
                    </label>
                    <Input
                      id="resolutionDeadline"
                      name="resolutionDeadline"
                      type="date"
                      value={formData.resolutionDeadline || ""}
                      onChange={handleInputChange}
                      className="h-8"
                    />
                  </div>
                </div>
              </div>
              
              {/* Coluna 3: Status e notas */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="severity" className="block text-sm font-medium mb-0.5">
                      Gravidade <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => handleSelectChange("severity", value)}
                    >
                      <SelectTrigger id="severity" className="h-8">
                        <SelectValue placeholder="Gravidade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium mb-0.5">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status" className="h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Reportado">Reportado</SelectItem>
                        <SelectItem value="Em Análise">Em Análise</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="implementedAction" className="block text-sm font-medium mb-0.5">
                    Ação Implementada
                  </label>
                  <Textarea
                    id="implementedAction"
                    name="implementedAction"
                    value={formData.implementedAction || ""}
                    onChange={handleInputChange}
                    rows={2}
                    className="resize-none"
                  />
                </div>
                
                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium mb-0.5">
                    Notas Administrativas
                  </label>
                  <Textarea
                    id="adminNotes"
                    name="adminNotes"
                    value={formData.adminNotes || ""}
                    onChange={handleInputChange}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Images section - simplified */}
            <div className="mt-2">
              <p className="text-sm font-medium">Imagens ({images.length})</p>
              {images.length > 0 && (
                <div className="grid grid-cols-6 gap-2 mt-1">
                  {images.slice(0, 6).map((image, index) => (
                    <div key={index} className="h-10 w-10">
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
                size="sm"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                size="sm"
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
