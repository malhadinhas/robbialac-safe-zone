
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getIncidents } from "@/services/incidentService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Plus, Eye } from "lucide-react";
import { Incident } from "@/types";
import NoScrollLayout from "@/components/NoScrollLayout";
import ImageGallery from "@/components/incidents/ImageGallery";

const QuaseAcidentes = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch incidents data
  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ["incidents"],
    queryFn: getIncidents
  });

  // Filter incidents based on search query
  const filteredIncidents = incidents?.filter(incident =>
    incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Handle incident selection
  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  // Generate pagination numbers
  const paginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
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
      // Add first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => setCurrentPage(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Add ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Calculate range around current page
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Add ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationLink>...</PaginationLink>
          </PaginationItem>
        );
      }
      
      // Add last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink 
              onClick={() => setCurrentPage(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    return items;
  };

  return (
    <NoScrollLayout>
      <div className="container p-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Quase Acidentes</h1>
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
              <Card key={incident.id} className="overflow-hidden">
                <div 
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50"
                  onClick={() => handleIncidentClick(incident)}
                >
                  <div className="flex-shrink-0">
                    {incident.images && incident.images.length > 0 ? (
                      <ImageGallery images={incident.images} showOnlyFirstImage={true} />
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
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      incident.status === "Resolvido" ? "bg-green-100 text-green-800" :
                      incident.status === "Em Análise" ? "bg-blue-100 text-blue-800" :
                      incident.status === "Arquivado" ? "bg-gray-100 text-gray-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {incident.status}
                    </div>
                    <Button size="icon" variant="ghost" className="text-muted-foreground">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
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

        {/* Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedIncident.title}</DialogTitle>
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
                      <div className={`px-2 py-1 rounded-full text-xs font-medium inline-block ${
                        selectedIncident.status === "Resolvido" ? "bg-green-100 text-green-800" :
                        selectedIncident.status === "Em Análise" ? "bg-blue-100 text-blue-800" :
                        selectedIncident.status === "Arquivado" ? "bg-gray-100 text-gray-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
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
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </NoScrollLayout>
  );
};

export default QuaseAcidentes;
