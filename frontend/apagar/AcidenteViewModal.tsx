import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { useEffect, useState } from 'react';
import { getAccidentById } from '@/services/accidentService';
import { Input } from '@/components/ui/input';
import { addInteractionComment, addInteractionLike } from '@/services/interactionService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AcidenteViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  accidentId: string;
  openComments?: boolean;
  onCommentAdded?: (accidentId: string) => void;
}

export function AcidenteViewModal({ isOpen, onClose, accidentId, openComments, onCommentAdded }: AcidenteViewModalProps) {
  const { user } = useAuth();
  const [accident, setAccident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInputText, setCommentInputText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getAccidentById(accidentId).then(acc => {
      setAccident(acc);
      setLoading(false);
    }).catch(() => setLoading(false));
    loadComments();
    loadLikes();
  }, [isOpen, accidentId]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/comment/accident/${accidentId}`, {
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

  const loadLikes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/like/accident/${accidentId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      const data = await response.json();
      setLikeCount(data.likeCount || 0);
      setUserHasLiked(data.userHasLiked || false);
    } catch (e) {
      setLikeCount(0);
      setUserHasLiked(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentInputText.trim()) return;
    try {
      await addInteractionComment(accidentId, 'accident', commentInputText.trim());
      setCommentInputText('');
      toast.success('Comentário adicionado!');
      await loadComments();
      if (onCommentAdded) onCommentAdded(accidentId);
      if (window?.dispatchEvent) window.dispatchEvent(new Event('feedShouldRefresh'));
      if (window?.dispatchEvent) window.dispatchEvent(new Event('incidentShouldRefresh'));
    } catch (e) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleLikeClick = async () => {
    try {
      await addInteractionLike(accidentId, 'accident');
      await loadLikes();
      if (window?.dispatchEvent) window.dispatchEvent(new Event('feedShouldRefresh'));
      if (window?.dispatchEvent) window.dispatchEvent(new Event('incidentShouldRefresh'));
    } catch (e) {
      toast.error('Erro ao registar gosto');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-6xl h-[90vh] flex p-0 overflow-hidden">
        {/* Área principal */}
        <div className="flex-1 flex flex-col min-w-0">
          <DialogHeader className="p-4 border-b flex-shrink-0 relative">
            <DialogTitle className="text-lg truncate text-center">
              {accident ? accident.name : 'Documento PDF'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">A carregar...</div>
            ) : accident && accident.pdfUrl ? (
              <PDFViewer url={accident.pdfUrl} className="h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-red-500">PDF não encontrado.</div>
            )}
          </div>
        </div>
        {/* Zona lateral de comentários e likes */}
        <div className="w-[340px] border-l bg-gray-50 h-full flex flex-col">
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
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
            {loadingComments ? (
              <div className="text-center text-gray-400">A carregar comentários...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-gray-400">Sem comentários ainda.</div>
            ) : (
              comments.map(comment => (
                <div key={comment._id} className="bg-white rounded-lg p-2 shadow-sm">
                  <div className="text-xs text-gray-600 font-semibold">{comment.user?.name || 'Utilizador'}</div>
                  <div className="text-sm text-gray-800 whitespace-pre-line">{comment.text}</div>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t flex gap-2">
            <Input
              value={commentInputText}
              onChange={e => setCommentInputText(e.target.value)}
              placeholder="Adicione um comentário..."
              className="flex-1"
              onKeyDown={e => { if (e.key === 'Enter') handleCommentSubmit(); }}
            />
            <button
              className="bg-blue-600 text-white rounded px-3 py-1 font-semibold hover:bg-blue-700"
              onClick={handleCommentSubmit}
              disabled={!commentInputText.trim()}
            >
              Enviar
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 