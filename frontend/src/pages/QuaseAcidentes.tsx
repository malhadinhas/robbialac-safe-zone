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
import Image from "next/image";
import { useIsCompactView } from '@/hooks/use-mobile';
import { QuaseAcidentesViewModal } from "@/components/incidents/QuaseAcidentesViewModal";
import { addInteractionLike } from '@/services/interactionService';

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
  const [openComments, setOpenComments] = useState(false);
  
  const isCompactView = useIsCompactView();
  const itemsPerPage = isCompactView ? 4 : 10;

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
  }, [searchQuery, viewMode, itemsPerPage]);

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

  useEffect(() => {
    const refreshListener = () => refetch();
    window.addEventListener('incidentShouldRefresh', refreshListener);
    return () => {
      window.removeEventListener('incidentShouldRefresh', refreshListener);
    };
  }, [refetch]);

  const handleIncidentClick = (incident: Incident) => {
    navigate(`/quase-acidentes/${incident._id || incident.id}`);
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
    mutationFn: (incident: Incident) => {
      const incidentId = incident._id || incident.id;
      return updateIncident(incidentId, { status: 'Arquivado' });
    },
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
    const incidentId = incidentToModify._id || incidentToModify.id;
    if (!incidentId || typeof incidentId !== 'string' || incidentId.length < 8) {
      toast.error('ID do incidente inválido. Não é possível apagar.');
      setIsDeleteConfirmOpen(false);
      setIncidentToModify(null);
      return;
    }
    deleteMutation.mutate(incidentId);
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
      // Preparar apenas os dados que precisam ser atualizados
      const updateData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        date: new Date(formData.date),
        status: formData.status,
        severity: formData.severity,
        department: formData.department,
        factoryArea: formData.factoryArea || undefined,
        implementedAction: formData.implementedAction || undefined,
        responsible: formData.responsible || undefined,
        adminNotes: formData.adminNotes || undefined,
        suggestionToFix: formData.suggestionToFix || undefined,
        resolutionDeadline: formData.resolutionDeadline ? new Date(formData.resolutionDeadline) : undefined,
        images: images,
        frequency: formData.frequency || undefined,
        risk: risk || undefined,
        qaQuality: qaQuality || undefined,
        pointsAwarded: formData.pointsAwarded || 0
      };
      
      // Remover campos undefined
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      // Usar o ID correto - pode ser _id ou id dependendo de como o MongoDB responde
      const incidentId = selectedIncident!._id || selectedIncident!.id;
      
      await updateIncident(incidentId, updateData);
      toast.success("Quase acidente atualizado com sucesso");
      setIsEditModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar quase acidente:", error);
      toast.error("Erro ao atualizar quase acidente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const paginationItems = () => {
    const items = [];
    const maxVisiblePages = isCompactView ? 3 : 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              size={isCompactView ? "sm" : "default"}
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
            size={isCompactView ? "sm" : "default"}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      const numEllipsisNeighbours = isCompactView ? 0 : 1;
      const startPage = Math.max(2, currentPage - numEllipsisNeighbours);
      const endPage = Math.min(totalPages - 1, currentPage + numEllipsisNeighbours);
      
      if (startPage > 2) {
        items.push(
          <PaginationItem key="page-ellipsis-start">
            <PaginationLink size={isCompactView ? "sm" : "default"}>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink 
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
              size={isCompactView ? "sm" : "default"}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
       if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="page-ellipsis-end">
            <PaginationLink size={isCompactView ? "sm" : "default"}>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key={`page-${totalPages}`}>
          <PaginationLink 
            onClick={() => setCurrentPage(totalPages)}
            isActive={currentPage === totalPages}
            size={isCompactView ? "sm" : "default"}
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

  const reactivateMutation = useMutation({
    mutationFn: (incident: Incident) => {
      const incidentId = incident._id || incident.id;
      return updateIncident(incidentId, { status: 'Reportado' });
    },
    onSuccess: () => {
      toast.success("Quase acidente reativado com sucesso");
      queryClient.invalidateQueries({ queryKey: ['incidents', viewMode] });
      setIsViewModalOpen(false);
    },
    onError: () => {
      toast.error("Erro ao reativar quase acidente");
    }
  });

  const handleReactivateClick = (event: React.MouseEvent, incident: Incident) => {
    event.stopPropagation();
    reactivateMutation.mutate(incident);
  };

  const handleLikeClick = async (incidentId: string) => {
    try {
      await addInteractionLike(incidentId, 'qa');
      if (window?.dispatchEvent) {
        window.dispatchEvent(new Event('incidentShouldRefresh'));
      }
    } catch (e) {
      toast.error('Erro ao registar gosto');
    }
  };

  const openCommentsModal = (incident: Incident) => {
    setSelectedIncident(incident);
    setOpenComments(true);
    setIsViewModalOpen(true);
  };

  return (
    <Layout>
      <div className={`h-full bg-[#f7faff] ${isCompactView ? 'flex flex-col overflow-hidden' : 'p-3 sm:p-6 overflow-y-auto'}`}>
        {isCompactView ? (
          // ----- MOBILE LAYOUT (Scroll na lista, sem paginação) ----- 
          <>
            {/* 1. Cabeçalho (Não encolhe) */}
            <div className="flex-shrink-0 p-3 border-b bg-white rounded-2xl shadow mb-4">
              {/* Título */}
              <h1 className="text-lg font-bold mb-2">
                Quase Acidentes ({viewMode === 'active' ? 'Ativos' : 'Arquivados'})
              </h1>
              {/* Pesquisa */}
              <div className="relative flex-1 mb-2">
                <input
                  type="text"
                placeholder="Procurar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-4 py-1 border rounded-lg text-sm"
              />
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
              {/* Botões */}
              <div className="flex gap-2">
              <Button 
                variant="outline"
                  onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                  className="flex-1 whitespace-nowrap h-8 px-2 text-xs rounded-full"
              >
                {viewMode === 'active' ? 'Ver Arquivados' : 'Ver Ativos'}
              </Button>
                <Button
                  onClick={() => navigate('/quase-acidentes/novo')}
                  className="flex-1 bg-robbialac hover:bg-robbialac-dark whitespace-nowrap h-8 px-2 text-xs rounded-full text-white font-semibold"
                >
                  + Novo
            </Button>
          </div>
        </div>
            {/* 2. Lista QA (Cards verticais) */} 
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {isLoading ? (
                  <div className="flex justify-center items-center pt-10">
            <p>Carregando...</p>
          </div>
        ) : error ? (
                  <div className="flex justify-center items-center pt-10">
                    <p className="text-red-500">Erro ao carregar</p>
          </div>
        ) : paginatedIncidents.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">Nenhum registro encontrado.</p>
          </div>
        ) : (
                <div className="grid grid-cols-1 gap-6"> 
            {paginatedIncidents.map((incident) => (
                    <div
                        key={incident._id || incident.id} 
                      className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer"
                  onClick={() => handleIncidentClick(incident)}
                >
                        {/* Imagem */}
                      <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                    {incident.images && incident.images.length > 0 ? (
                            <img src={incident.images[0]} alt={incident.title} className="w-full h-full object-cover" />
                          ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Sem imagem</div>
                    )}
                  </div>
                        {/* Conteúdo */} 
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="text-base font-bold text-gray-800 truncate mb-1">{incident.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{incident.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusStyle(incident.status)} mr-2`}>{incident.status}</span>
                          <span>{incident.date ? new Date(incident.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                        <div className="flex items-center gap-2 mt-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full hover:bg-blue-50 ${incident.userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                            onClick={e => {
                              e.stopPropagation();
                              if (incident._id) {
                                handleLikeClick(incident._id);
                              } else {
                                toast.error('Não é possível dar like neste item (ID inválido)');
                              }
                            }}
                            aria-label="Gosto"
                          >
                            👍
                            <span className="ml-1 text-base">{incident.likeCount || 0}</span>
                    </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-blue-50"
                            onClick={e => { e.stopPropagation(); openCommentsModal(incident); }}
                            aria-label="Comentários"
                          >
                            💬
                            <span className="ml-1 text-base">{incident.commentCount || 0}</span>
                        </Button>
                            {isAdmin && viewMode === 'active' && (
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleArchiveClick(e, incident); }}>
                              <Archive className="h-5 w-5 text-yellow-600" />
                              </Button>
                            )}
                            {isAdmin && viewMode === 'archived' && (
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleReactivateClick(e, incident); }}>
                              <ArchiveX className="h-5 w-5 text-green-600" />
                              </Button>
                            )}
                             {isAdmin && (
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleDeleteClick(e, incident); }}>
                              <Trash2 className="h-5 w-5 text-red-600" />
                              </Button>
                            )}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
            </div>
          </>
        ) : (
          // ----- DESKTOP LAYOUT ----- 
          <div className="container mx-auto">
              {/* Header Section */}
              <div className="p-4 space-y-4">
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                  <h1 className="text-lg sm:text-2xl font-bold">
                    Quase Acidentes ({viewMode === 'active' ? 'Ativos' : 'Arquivados'})
                  </h1>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Procurar..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-4 py-1 border rounded-lg text-sm"
                    />
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex gap-2 sm:flex-none">
                        <Button 
                      variant="outline"
                      onClick={() => setViewMode(viewMode === 'active' ? 'archived' : 'active')}
                    className="flex-1 whitespace-nowrap h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm rounded-full"
                    >
                      {viewMode === 'active' ? 'Ver Arquivados' : 'Ver Ativos'}
                        </Button>
                        <Button 
                      onClick={() => navigate('/quase-acidentes/novo')}
                    className="flex-1 bg-robbialac hover:bg-robbialac-dark whitespace-nowrap h-8 px-2 text-xs sm:h-9 sm:px-3 sm:text-sm rounded-full text-white font-semibold"
                    >
                      + Novo
                        </Button>
                  </div>
                </div>
              </div>
              {/* Content Section */} 
            <div className="space-y-6 mt-6">
                 {isLoading ? ( <p>Carregando...</p> ) 
                   : error ? ( <p>Erro</p> ) 
                   : paginatedIncidents.length === 0 ? ( <p>Nenhum registro</p> ) 
                   : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {paginatedIncidents.map((incident) => (
                      <div
                        key={incident._id || incident.id}
                        className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer"
                        onClick={() => handleIncidentClick(incident)}
                      >
                             {/* Imagem */}
                        <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
                              {incident.images && incident.images.length > 0 ? (
                                <img src={incident.images[0]} alt={incident.title} className="w-full h-full object-cover" />
                              ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Sem imagem</div>
                    )}
                  </div>
                            {/* Conteúdo */} 
                        <div className="p-4 flex-1 flex flex-col">
                          <h3 className="text-base font-bold text-gray-800 truncate mb-1">{incident.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{incident.description}</p>
                          <div className="flex items-center text-xs text-gray-500 mb-2">
                            <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusStyle(incident.status)} mr-2`}>{incident.status}</span>
                            <span>{incident.date ? new Date(incident.date).toLocaleDateString() : 'N/A'}</span>
                                </div>
                          <div className="flex items-center gap-2 mt-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`rounded-full hover:bg-blue-50 ${incident.userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                              onClick={e => {
                                e.stopPropagation();
                                if (incident._id) {
                                  handleLikeClick(incident._id);
                                } else {
                                  toast.error('Não é possível dar like neste item (ID inválido)');
                                }
                              }}
                              aria-label="Gosto"
                            >
                              👍
                              <span className="ml-1 text-base">{incident.likeCount || 0}</span>
                                </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover:bg-blue-50"
                              onClick={e => { e.stopPropagation(); openCommentsModal(incident); }}
                              aria-label="Comentários"
                            >
                              💬
                              <span className="ml-1 text-base">{incident.commentCount || 0}</span>
                                  </Button>
                                {isAdmin && viewMode === 'active' && (
                              <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleArchiveClick(e, incident); }}>
                                <Archive className="h-5 w-5 text-yellow-600" />
                                  </Button>
                                )}
                                {isAdmin && viewMode === 'archived' && (
                              <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleReactivateClick(e, incident); }}>
                                <ArchiveX className="h-5 w-5 text-green-600" />
                                  </Button>
                                )}
                            {isAdmin && (
                              <Button variant="ghost" size="icon" className="rounded-full" onClick={e => { e.stopPropagation(); handleDeleteClick(e, incident); }}>
                                <Trash2 className="h-5 w-5 text-red-600" />
                                  </Button>
                                )}
                </div>
          </div>
              </div>
                    ))}
          </div>
        )}
          </div>
                    </div>
                  )}
                  </div>
                  
        {isViewModalOpen && selectedIncident && (
          <QuaseAcidentesViewModal
            isOpen={isViewModalOpen}
            onClose={() => {
                          setIsViewModalOpen(false);
              setOpenComments(false);
            }}
            incidentId={selectedIncident._id || selectedIncident.id}
            openComments={openComments}
          />
        )}
        {isArchiveConfirmOpen && (
          <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Arquivar Quase Acidente</DialogTitle>
              </DialogHeader>
              <div className="my-4">Tens a certeza que queres arquivar este quase acidente?</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsArchiveConfirmOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={confirmArchive}>Arquivar</Button>
                  </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
        {isDeleteConfirmOpen && (
          <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>Apagar Quase Acidente</DialogTitle>
                </DialogHeader>
              <div className="my-4 text-red-600">Esta ação é irreversível. Tens a certeza que queres apagar?</div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={confirmDelete}>Apagar</Button>
                  </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
    </Layout>
  );
};

export default QuaseAcidentes;
