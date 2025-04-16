import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncidents, updateIncident, deleteIncident } from "@/services/incidentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Plus, Eye, Edit, Trash2, Archive, ArchiveX, Save } from "lucide-react";
import { Incident } from "@/types";
import { Layout } from "@/components/Layout";
import ImageGallery from "@/components/incidents/ImageGallery";
import ImageUploader from "@/components/incidents/ImageUploader";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const QuaseAcidentes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [incidentToModify, setIncidentToModify] = useState<Incident | null>(null);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const itemsPerPage = 10;

  const isAdmin = user?.role === "admin_app" || user?.role === "admin_qa";

  const { data: incidents, isLoading, error, refetch } = useQuery({
    queryKey: ["incidents", viewMode],
    queryFn: () => getIncidents(viewMode === 'active' ? 'active' : 'archived')
  });

  const filteredIncidents = incidents?.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedIncident && isEditModalOpen) {
      setFormData({
        id: selectedIncident.id,
        title: selectedIncident.title,
        description: selectedIncident.description,
        location: selectedIncident.location,
        date: selectedIncident.date instanceof Date 
          ? selectedIncident.date.toISOString().split('T')[0] 
          : new Date(selectedIncident.date).toISOString().split('T')[0],
        severity: selectedIncident.severity,
        status: selectedIncident.status,
        department: selectedIncident.department,
        implementedAction: selectedIncident.implementedAction || "",
        responsible: selectedIncident.responsible || "",
        adminNotes: selectedIncident.adminNotes || "",
        suggestionToFix: selectedIncident.suggestionToFix || "",
        resolutionDeadline: selectedIncident.resolutionDeadline 
          ? (selectedIncident.resolutionDeadline instanceof Date 
              ? selectedIncident.resolutionDeadline.toISOString().split('T')[0] 
              : new Date(selectedIncident.resolutionDeadline).toISOString().split('T')[0]) 
          : "",
        reportedBy: selectedIncident.reportedBy,
        pointsAwarded: selectedIncident.pointsAwarded,
        factoryArea: selectedIncident.factoryArea || ""
      });
      
      if (selectedIncident.images) {
        setImages(selectedIncident.images);
      } else {
        setImages([]);
      }
    }
  }, [selectedIncident, isEditModalOpen]);

  useEffect(() => {
    if (!isEditModalOpen && selectedIncident) {
      refetch();
    }
  }, [isEditModalOpen, refetch]);

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsViewModalOpen(true);
  };

  const handleEditIncident = (event: React.MouseEvent, incident: Incident) => {
    event.stopPropagation();
    setSelectedIncident(incident);
    setIsEditModalOpen(true);
  };

  const handleArchiveClick = (event: React.MouseEvent, incident: Incident) => {
    event.stopPropagation();
    setIncidentToModify(incident);
    setIsArchiveConfirmOpen(true);
  };

  const handleDeleteClick = (event: React.MouseEvent, incident: Incident) => {
    event.stopPropagation();
    setIncidentToModify(incident);
    setIsDeleteConfirmOpen(true);
  };

  const archiveMutation = useMutation({
    mutationFn: (incident: Incident) => updateIncident(incident._id, { status: 'Arquivado' }),
    onSuccess: () => {
      toast.success("Quase acidente arquivado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['incidents', viewMode] });
      setIsArchiveConfirmOpen(false);
      setIncidentToModify(null);
    },
    onError: () => {
      toast.error("Erro ao arquivar quase acidente");
      setIsArchiveConfirmOpen(false);
      setIncidentToModify(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (incidentId: string) => deleteIncident(incidentId),
    onSuccess: () => {
      toast.success("Quase acidente apagado permanentemente");
      queryClient.invalidateQueries({ queryKey: ['incidents', viewMode] });
      setIsDeleteConfirmOpen(false);
      setIncidentToModify(null);
    },
    onError: () => {
      toast.error("Erro ao apagar quase acidente");
      setIsDeleteConfirmOpen(false);
      setIncidentToModify(null);
    }
  });

  const confirmArchive = () => {
    if (!incidentToModify) return;
    archiveMutation.mutate(incidentToModify);
  };

  const confirmDelete = () => {
    if (!incidentToModify) return;
    deleteMutation.mutate(incidentToModify._id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const calculateRiskAndQuality = (severity?: string, frequency?: string) => {
    const gravityMap = { 'Baixo': 1, 'Médio': 4, 'Alto': 7 };
    const frequencyMap = { 'Baixa': 2, 'Moderada': 6, 'Alta': 8 };

    const gravityValue = severity ? gravityMap[severity] || 0 : 0;
    const frequencyValue = frequency ? frequencyMap[frequency] || 0 : 0;
    
    const risk = gravityValue * frequencyValue;
    
    let qaQuality: "Baixa" | "Média" | "Alta" = "Baixa";
    if (risk > 24) qaQuality = "Alta";
    else if (risk >= 8) qaQuality = "Média";
    
    return { risk, qaQuality };
  };

  const { risk, qaQuality } = calculateRiskAndQuality(formData.severity, formData.frequency);

  const getQualityColor = (quality: "Baixa" | "Média" | "Alta") => {
    switch (quality) {
      case 'Baixa': return 'bg-yellow-100 text-yellow-800';
      case 'Média': return 'bg-orange-100 text-orange-800';
      case 'Alta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updatedIncident = {
        ...selectedIncident!,
        ...formData,
        id: selectedIncident!.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: new Date(formData.date),
        status: formData.status as "Reportado" | "Em Análise" | "Resolvido" | "Arquivado",
        severity: formData.severity as "Baixo" | "Médio" | "Alto",
        reportedBy: formData.reportedBy || selectedIncident!.reportedBy,
        department: formData.department,
        pointsAwarded: formData.pointsAwarded || selectedIncident!.pointsAwarded || 0,
        resolutionDeadline: formData.resolutionDeadline ? new Date(formData.resolutionDeadline) : undefined,
        images: images,
        implementedAction: formData.implementedAction,
        responsible: formData.responsible,
        adminNotes: formData.adminNotes,
        suggestionToFix: formData.suggestionToFix,
        factoryArea: formData.factoryArea,
        gravityValue: formData.gravityValue,
        frequency: formData.frequency as "Baixa" | "Moderada" | "Alta",
        frequencyValue: formData.frequencyValue,
        risk: risk,
        qaQuality: qaQuality,
        resolutionDays: formData.resolutionDays,
        reporterName: formData.reporterName,
        completionDate: formData.completionDate ? new Date(formData.completionDate) : undefined
      } as Incident;
      
      await updateIncident(updatedIncident);
      toast.success("Quase acidente atualizado com sucesso");
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar quase acidente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      items.push(
        <PaginationItem key="page-1">
          <PaginationLink 
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="page-ellipsis-start">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="page-ellipsis-end">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Resolvido":
        return "bg-green-100 text-green-800";
      case "Em Análise":
        return "bg-blue-100 text-blue-800";
      case "Arquivado":
        return "bg-gray-100 text-gray-800";
      case "Reportado":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Layout>
      <div className="container p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Quase Acidentes ({viewMode === 'active' ? 'Ativos' : 'Arquivados'})</h1>
          <div className="flex w-full md:w-auto gap-2">
            <div className="relative flex-grow md:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Procurar..."
                className="pl-8 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {isAdmin && (
              <Button 
                variant="outline"
                onClick={() => setViewMode(prev => prev === 'active' ? 'archived' : 'active')}
              >
                {viewMode === 'active' ? 'Ver Arquivados' : 'Ver Ativos'}
              </Button>
            )}
            <Button onClick={() => navigate("/quase-acidentes/novo")}>
              <Plus className="h-4 w-4 mr-2" /> Novo
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Carregando...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-red-500">Erro ao carregar quase acidentes</p>
          </div>
        ) : paginatedIncidents.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-lg">
            <p className="text-muted-foreground">
              {searchQuery ? "Nenhum resultado encontrado para sua busca." : "Nenhum quase acidente registrado."}
            </p>
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchQuery("")}>
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paginatedIncidents.map((incident) => (
              <Card key={incident._id} className="overflow-hidden">
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="flex-shrink-0 w-16 h-16">
                    {incident.images && incident.images.length > 0 ? (
                      <ImageGallery 
                        images={incident.images} 
                        showOnlyFirstImage={true} 
                        className="m-0 h-full w-full"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center text-xs text-slate-500">
                        Sem imagem
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-medium text-base truncate">{incident.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {incident.location} • {new Date(incident.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(incident.status)}`}>
                      {incident.status}
                    </div>
                    <Button size="icon" variant="ghost" className="text-muted-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {isAdmin && incident.status !== "Arquivado" && (
                      <>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-blue-500"
                          onClick={(e) => handleEditIncident(e, incident)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-yellow-500"
                          onClick={(e) => handleArchiveClick(e, incident)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="text-red-500"
                          onClick={(e) => handleDeleteClick(e, incident)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {paginationItems()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedIncident.title}</DialogTitle>
                  <DialogDescription>
                    Detalhes do Quase Acidente reportado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Local</h3>
                      <p className="text-sm">{selectedIncident.location}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Data</h3>
                      <p className="text-sm">{new Date(selectedIncident.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Departamento</h3>
                      <p className="text-sm">{selectedIncident.department}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Gravidade</h3>
                      <p className="text-sm">{selectedIncident.severity}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${getStatusStyle(selectedIncident.status)}`}>
                        {selectedIncident.status}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Reportado por</h3>
                      <p className="text-sm">{selectedIncident.reporterName || selectedIncident.reportedBy}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Descrição</h3>
                    <p className="text-sm whitespace-pre-line">{selectedIncident.description}</p>
                  </div>
                  
                  {selectedIncident.suggestionToFix && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Sugestão de Correção</h3>
                      <p className="text-sm">{selectedIncident.suggestionToFix}</p>
                    </div>
                  )}
                  
                  {selectedIncident.implementedAction && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Ação Implementada</h3>
                      <p className="text-sm">{selectedIncident.implementedAction}</p>
                    </div>
                  )}
                  
                  {selectedIncident.images && selectedIncident.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Imagens</h3>
                      <ImageGallery images={selectedIncident.images} />
                    </div>
                  )}
                </div>

                {isAdmin && selectedIncident.status !== "Arquivado" && (
                  <DialogFooter className="flex justify-end space-x-2 mt-6">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Editar
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => {
                        setIsViewModalOpen(false);
                        setIsArchiveConfirmOpen(true);
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" /> Arquivar
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <DialogTitle>Editar Quase Acidente</DialogTitle>
                  <DialogDescription>
                    Modifique os detalhes do Quase Acidente e salve as alterações.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="py-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          rows={4}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="department" className="block text-sm font-medium mb-1">
                            Departamento <span className="text-red-500">*</span>
                          </label>
                          <Input
                            id="department"
                            name="department"
                            value={formData.department || ""}
                            onChange={handleInputChange}
                            required
                          />
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
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="severity" className="block text-sm font-medium mb-1">
                          Gravidade <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.severity || ''}
                          onValueChange={(value) => handleSelectChange("severity", value)}
                        >
                          <SelectTrigger id="severity">
                            <SelectValue placeholder="Selecione a gravidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baixo">Baixo</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Alto">Alto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label htmlFor="frequency" className="block text-sm font-medium mb-1">
                          Frequência <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.frequency || ''}
                          onValueChange={(value) => handleSelectChange("frequency", value)}
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Baixa">Baixa</SelectItem>
                            <SelectItem value="Moderada">Moderada</SelectItem>
                            <SelectItem value="Alta">Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Risco (Calculado)
                        </label>
                        <Input
                          value={`${risk} pts`}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Qualidade QA (Calculada)
                        </label>
                        <div className={`px-3 py-2 rounded-md text-sm font-medium ${getQualityColor(qaQuality)}`}>
                          {qaQuality}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="status" className="block text-sm font-medium mb-1">
                          Status <span className="text-red-500">*</span>
                        </label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger id="status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Reportado">Reportado</SelectItem>
                            <SelectItem value="Em Análise">Em Análise</SelectItem>
                            <SelectItem value="Resolvido">Resolvido</SelectItem>
                            <SelectItem value="Arquivado">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

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
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Imagens</h3>
                    <ImageUploader 
                      onImagesSelected={() => {}} 
                      onImagesChange={handleImagesChange}
                    />
                    
                    {images.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">Imagens Atuais ({images.length})</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img 
                                src={image} 
                                alt={`Imagem ${index + 1}`} 
                                className="h-24 w-full object-cover rounded-md border border-gray-200"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => {
                                    const updatedImages = images.filter((_, i) => i !== index);
                                    setImages(updatedImages);
                                  }}
                                >
                                  Remover
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex justify-end gap-3 mt-6">
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-robbialac hover:bg-robbialac-dark"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Salvar Alterações
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Arquivar quase acidente?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja arquivar este quase acidente? Ele será movido para a vista de arquivados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIncidentToModify(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmArchive} 
                className="bg-yellow-500 hover:bg-yellow-600" 
                disabled={archiveMutation.isPending}
              >
                {archiveMutation.isPending ? "Arquivando..." : "Arquivar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Apagar quase acidente?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é PERMANENTE e não pode ser desfeita. Tem certeza que deseja apagar este quase acidente?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIncidentToModify(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete} 
                className="bg-red-600 hover:bg-red-700" 
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Apagando..." : "Apagar Permanentemente"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default QuaseAcidentes;
