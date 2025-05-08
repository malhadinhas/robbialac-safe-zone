import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveX, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncidentById, updateIncident, deleteIncident } from "@/services/incidentService";
import ImageGallery from "@/components/incidents/ImageGallery";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Input } from '@/components/ui/input';
import { addInteractionComment, addInteractionLike } from '@/services/interactionService';
import { toast } from 'sonner';
import { QuaseAcidentesEditModal } from '@/pages/QuaseAcidentesEditar';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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
  const [comments, setComments] = useState<{ _id: string; user: { _id: string, name: string }; text: string; createdAt: Date }[]>([]);
  const [commentInputText, setCommentInputText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [userHasLiked, setUserHasLiked] = useState<boolean>(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const isWide = useMediaQuery('(min-width: 900px)');

  const { data: selectedIncident, isLoading, error } = useQuery({
    queryKey: ["incident", incidentId],
    queryFn: () => getIncidentById(incidentId),
    enabled: !!incidentId,
  });

  // Função para normalizar comentários recebidos do backend
  const normalizeComments = (comments: any[]) =>
    comments.map(comment => ({
      ...comment,
      user: {
        _id: comment.userId || '',
        name: comment.userName || 'Utilizador'
      }
    }));

  // Função para buscar comentários do QA
  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/comment/qa/${incidentId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      // Aceita tanto {comments: [...]} como array direto, normalizando sempre
      if (Array.isArray(data)) {
        setComments(normalizeComments(data));
      } else if (Array.isArray(data.comments)) {
        setComments(normalizeComments(data.comments));
      } else {
        setComments([]);
      }
    } catch (e) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Carregar likes ao abrir a modal
  const loadLikes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/like/qa/${incidentId}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await response.json();
      setLikeCount(data.likeCount || 0);
      setUserHasLiked(data.userHasLiked || false);
    } catch (e) {
      setLikeCount(0);
      setUserHasLiked(false);
    }
  };

  // Carregar comentários ao abrir a modal
  useEffect(() => {
    if (isOpen && incidentId) {
      loadComments();
      loadLikes();
    }
  }, [isOpen, incidentId]);

  // Submeter novo comentário
  const handleCommentSubmit = async () => {
    if (!commentInputText.trim()) return;
    try {
      const newComment = await addInteractionComment(incidentId, 'qa', commentInputText.trim());
      setCommentInputText('');
      toast.success('Comentário adicionado!');
      // Recarregar comentários do backend para garantir consistência e contagem
      await loadComments();
      // Opcional: trigger para atualizar feed (ex: via contexto, evento ou refetch global)
      if (window?.dispatchEvent) {
        window.dispatchEvent(new Event('feedShouldRefresh'));
      }
    } catch (e) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleLikeClick = async () => {
    try {
      await addInteractionLike(incidentId, 'qa');
      await loadLikes();
      if (window?.dispatchEvent) {
        window.dispatchEvent(new Event('incidentShouldRefresh'));
      }
    } catch (e) {
      toast.error('Erro ao dar gosto');
    }
  };

  // Mutations para arquivar, reativar e apagar (opcional, pode ser omitido se não for necessário aqui)

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden min-w-[640px]">
        <div className="flex-1 flex flex-row min-w-0">
          {/* Área principal flexível */}
          <div className={`flex-1 flex flex-col min-w-0 p-4 ${isWide ? '' : 'w-full'}`}
            style={{ transition: 'width 0.3s', maxHeight: '90vh', overflowY: 'auto' }}>
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
                <div className="space-y-4 sm:space-y-6 py-4 flex-1 flex flex-col">
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
                      {selectedIncident?.images && selectedIncident.images.length > 0 && (
                        <div className="flex flex-col items-center justify-center w-full h-full">
                          <div
                            className="relative flex items-center justify-center"
                            style={{
                              minWidth: '300px',
                              minHeight: '200px',
                              maxWidth: '100%',
                              maxHeight: '40vh',
                              width: '100%',
                              height: '100%',
                              flexShrink: 1,
                              flexGrow: 0
                            }}
                          >
                            <ImageGallery
                              images={selectedIncident.images}
                              showControls={true}
                              className="w-full h-auto object-contain max-h-[40vh]"
                            />
                          </div>
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
          </div>
          {/* Barra lateral de comentários (só se largo) */}
          {isWide && (
            <div className="w-[320px] border-l bg-gray-50 flex flex-col h-full transition-all duration-300">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold">Comentários</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border-b">
                <button
                  className={`rounded-full p-2 hover:bg-blue-100 ${userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                  onClick={handleLikeClick}
                  aria-label="Gosto"
                >
                  👍 <span className="ml-1 text-base">{likeCount}</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                {loadingComments ? (
                  <div className="text-center text-gray-400">A carregar comentários...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center text-gray-400">Nenhum comentário ainda.</div>
                ) : (
                  comments.map((comment, idx) => (
                    <div key={comment._id || idx} className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{comment.user.name}</span>
                        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('pt-PT')}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        {/* Barra fixa no fundo para botões e input de comentário */}
        {(isAdmin || isWide) && (
          <div className="w-full flex flex-row items-center gap-4 p-4 border-t bg-white z-30">
            {isAdmin && (
              <div className="flex flex-row gap-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="rounded-full">Editar</Button>
                <Button variant="destructive" onClick={() => setIsArchiveConfirmOpen(true)} className="rounded-full">Arquivar</Button>
                <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)} className="rounded-full">Apagar</Button>
              </div>
            )}
            {isWide && (
              <div className="flex-1 flex flex-row gap-2 ml-auto">
                <Input
                  value={commentInputText}
                  onChange={e => setCommentInputText(e.target.value)}
                  placeholder="Comente..."
                  className="flex-1"
                />
                <Button onClick={handleCommentSubmit} className="bg-[#1E90FF] text-white rounded-full">Enviar</Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      {/* Modal de edição */}
      {isEditModalOpen && (
        <QuaseAcidentesEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          incidentId={incidentId}
        />
      )}

      {/* Modal de confirmação de arquivar */}
      {isArchiveConfirmOpen && (
        <Dialog open={isArchiveConfirmOpen} onOpenChange={setIsArchiveConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Arquivar Quase Acidente</DialogTitle>
            </DialogHeader>
            <div className="my-4">Tens a certeza que queres arquivar este quase acidente?</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsArchiveConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  await updateIncident(incidentId, { status: 'Arquivado' });
                  setIsArchiveConfirmOpen(false);
                  onClose();
                  if (window?.dispatchEvent) window.dispatchEvent(new Event('incidentShouldRefresh'));
                  toast.success('Quase acidente arquivado!');
                } catch (e) {
                  toast.error('Erro ao arquivar quase acidente');
                }
              }}>Arquivar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de confirmação de apagar */}
      {isDeleteConfirmOpen && (
        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apagar Quase Acidente</DialogTitle>
            </DialogHeader>
            <div className="my-4 text-red-600">Esta ação é irreversível. Tens a certeza que queres apagar?</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                try {
                  await deleteIncident(incidentId);
                  setIsDeleteConfirmOpen(false);
                  onClose();
                  if (window?.dispatchEvent) window.dispatchEvent(new Event('incidentShouldRefresh'));
                  toast.success('Quase acidente apagado!');
                } catch (e) {
                  toast.error('Erro ao apagar quase acidente');
                }
              }}>Apagar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
} 