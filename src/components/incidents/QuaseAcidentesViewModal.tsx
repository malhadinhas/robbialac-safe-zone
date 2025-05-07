import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveX, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncidentById, updateIncident, deleteIncident } from "@/services/incidentService";
import ImageGallery from "@/components/incidents/ImageGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface QuaseAcidentesViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
  openComments?: boolean;
}

export function QuaseAcidentesViewModal({ isOpen, onClose, incidentId, openComments }: QuaseAcidentesViewModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin_app" || user?.role === "admin_qa";
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const { data: selectedIncident, isLoading, error } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentById(incidentId),
    enabled: !!incidentId,
  });

  // Mutations para arquivar, reativar e apagar (opcional, pode ser omitido se não for necessário aqui)

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] sm:w-auto h-[90vh] sm:h-auto overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-lg">A carregar...</div>
        ) : error ? (
          <div className="text-center text-red-600 p-4">Erro ao carregar o quase acidente.</div>
        ) : selectedIncident ? (
          <>
            <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
              <DialogTitle className="text-xl break-words">{selectedIncident.title}</DialogTitle>
              <DialogDescription>Detalhes do Quase Acidente reportado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 sm:space-y-6 py-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Local</h3>
                      <p className="text-sm break-words">{selectedIncident.location}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Data</h3>
                      <p className="text-sm">{new Date(selectedIncident.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Departamento</h3>
                      <p className="text-sm break-words">{selectedIncident.department}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Gravidade</h3>
                      <p className="text-sm">{selectedIncident.severity}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <div className="px-2 py-1 rounded-full text-xs font-medium inline-block bg-gray-100 text-gray-800">
                        {selectedIncident.status}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Reportado por</h3>
                      <p className="text-sm break-words">{selectedIncident.reporterName || selectedIncident.reportedBy}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <h3 className="text-sm font-medium mb-1">Descrição</h3>
                    <p className="text-sm whitespace-pre-wrap break-words">{selectedIncident.description}</p>
                  </div>
                  {selectedIncident.suggestionToFix && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Sugestão de Correção</h3>
                      <p className="text-sm whitespace-pre-wrap break-words">{selectedIncident.suggestionToFix}</p>
                    </div>
                  )}
                  {selectedIncident.implementedAction && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-sm font-medium mb-1">Ação Implementada</h3>
                      <p className="text-sm whitespace-pre-wrap break-words">{selectedIncident.implementedAction}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {selectedIncident.images && selectedIncident.images.length > 0 ? (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-3">Imagens do Quase Acidente</h3>
                      <div className="relative aspect-[4/3] w-full">
                        <ImageGallery 
                          images={selectedIncident.images} 
                          showControls={true}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 p-8 rounded-lg">
                      <div className="text-slate-400 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                      </div>
                      <p className="text-slate-500 text-center">Nenhuma imagem disponível para este quase acidente.</p>
                    </div>
                  )}
                  {selectedIncident.qaQuality && (
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium mb-2">Análise de Risco</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Nível de Risco</p>
                          <p className="font-medium">{selectedIncident.risk || "N/A"} pontos</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Qualidade QA</p>
                          <div className="px-2 py-1 rounded-full text-xs font-medium inline-block bg-gray-100 text-gray-800">
                            {selectedIncident.qaQuality}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
} 