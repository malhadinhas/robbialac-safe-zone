import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getIncidentById, updateIncident, deleteIncident } from "@/services/incidentService";
import { addInteractionComment, addInteractionLike } from '@/services/interactionService';
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { QuaseAcidentesEditModal } from '@/pages/QuaseAcidentesEditar';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import ImageGallery from "@/components/incidents/ImageGallery";
import { Layout } from "@/components/Layout";

export default function QuaseAcidentesView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isWide = useMediaQuery('(min-width: 1024px)');
  const isAdmin = user?.role === "admin_qa" || user?.role === "admin_app";

  const [commentInputText, setCommentInputText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const { data: selectedIncident, isLoading, error } = useQuery({
    queryKey: ['incident', id],
    queryFn: () => getIncidentById(id || ''),
    enabled: !!id
  });

  // Função para buscar comentários do endpoint correto
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/comment/qa/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.comments;
      setComments(Array.isArray(arr) ? arr.map(comment => ({
        ...comment,
        user: {
          _id: comment.userId || '',
          name: comment.userName || 'Utilizador'
        }
      })) : []);
    } catch (e) {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (id) fetchComments();
  }, [id]);

  const handleCommentSubmit = async () => {
    if (!commentInputText.trim() || !selectedIncident) return;
    try {
      await addInteractionComment(selectedIncident._id || selectedIncident.id, 'qa', commentInputText);
      setCommentInputText('');
      await fetchComments();
      toast.success('Comentário adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleLike = async () => {
    if (!selectedIncident) return;
    
    try {
      await addInteractionLike(selectedIncident._id || selectedIncident.id, 'qa');
      queryClient.invalidateQueries({ queryKey: ['incident', id] });
      toast.success('Like adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar like');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-40 text-lg">A carregar...</div>
      </Layout>
    );
  }

  if (error || !selectedIncident) {
    return (
      <Layout>
        <div className="text-center text-red-600 p-4">Erro ao carregar o quase acidente.</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[80vh] bg-[#f7faff] py-8 px-2 sm:px-6">
        <div className="container mx-auto">
          <div className="flex-1 flex flex-row min-w-0">
            <div className={`flex-1 flex flex-col min-w-0 p-4 ${isWide ? '' : 'w-full'}`}
              style={{ transition: 'width 0.3s', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="space-y-4 sm:space-y-6 py-4 flex-1 flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card de Dados do Quase Acidente */}
                  <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-6 border border-slate-100">
                    <div className="mb-2">
                      <h1 className="text-2xl font-bold break-words">{selectedIncident.title}</h1>
                      <p className="text-gray-600 text-base">Detalhes do Quase Acidente reportado.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h3 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Local</h3>
                        <p className="text-sm break-words font-medium text-slate-800">{selectedIncident.location}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h3 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Data</h3>
                        <p className="text-sm font-medium text-slate-800">{new Date(selectedIncident.date).toLocaleDateString()}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h3 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Departamento</h3>
                        <p className="text-sm break-words font-medium text-slate-800">{selectedIncident.department}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h3 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Gravidade</h3>
                        <p className="text-sm font-medium text-slate-800">{selectedIncident.severity}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <h3 className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Descrição</h3>
                      <p className="text-sm whitespace-pre-wrap text-slate-800">{selectedIncident.description}</p>
                    </div>
                    {selectedIncident.images && selectedIncident.images.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <h3 className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Imagens</h3>
                        <ImageGallery images={selectedIncident.images} />
                      </div>
                    )}
                  </div>
                  {/* Card de Comentários */}
                  <div className="bg-white rounded-2xl shadow-md p-6 flex flex-col gap-4 border border-slate-100">
                    <h3 className="text-base font-bold text-slate-800 mb-2">Comentários</h3>
                    <div
                      className="flex-1 flex flex-col gap-2"
                      style={{ maxHeight: 320, overflowY: 'auto' }}
                    >
                      {loadingComments ? (
                        <div className="text-center text-gray-400">A carregar comentários...</div>
                      ) : comments.length === 0 ? (
                        <div className="text-center text-gray-400">Sem comentários ainda.</div>
                      ) : (
                        comments.map((comment, index) => (
                          <div key={comment._id || index} className="rounded-lg bg-slate-50 px-3 py-2 flex flex-col border border-slate-100">
                            <span className="text-sm text-slate-800">{comment.text}</span>
                            <span className="text-xs text-slate-500 mt-1">
                              Por {comment.user?.name || 'Usuário'} em {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-row items-center gap-4 p-4 border-t bg-white z-30">
                {isAdmin && (
                  <div className="flex flex-row gap-2">
                    <Button variant="outline" onClick={() => setIsEditModalOpen(true)} className="rounded-full">Editar</Button>
                    <Button variant="destructive" onClick={() => setIsArchiveConfirmOpen(true)} className="rounded-full">Arquivar</Button>
                    <Button variant="destructive" onClick={() => setIsDeleteConfirmOpen(true)} className="rounded-full">Apagar</Button>
                  </div>
                )}
                <div className="flex-1 flex flex-row gap-2 ml-auto">
                  <Input
                    value={commentInputText}
                    onChange={e => setCommentInputText(e.target.value)}
                    placeholder="Comente..."
                    className="flex-1"
                  />
                  <Button onClick={handleCommentSubmit} className="bg-[#1E90FF] text-white rounded-full">Enviar</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {isEditModalOpen && (
        <QuaseAcidentesEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          incidentId={id || ''}
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
                  await updateIncident(id || '', { status: 'Arquivado' });
                  setIsArchiveConfirmOpen(false);
                  navigate('/quase-acidentes');
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
                  await deleteIncident(id || '');
                  setIsDeleteConfirmOpen(false);
                  navigate('/quase-acidentes');
                  toast.success('Quase acidente apagado!');
                } catch (e) {
                  toast.error('Erro ao apagar quase acidente');
                }
              }}>Apagar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Layout>
  );
} 