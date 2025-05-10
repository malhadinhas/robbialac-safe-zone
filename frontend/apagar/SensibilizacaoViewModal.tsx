import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { useEffect, useState } from 'react';
import { getSensibilizacaoById } from '@/services/sensibilizacaoService';
import { Input } from '@/components/ui/input';
import { addInteractionComment, addInteractionLike } from '@/services/interactionService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SensibilizacaoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  openComments?: boolean;
}

export function SensibilizacaoViewModal({ isOpen, onClose, docId }: SensibilizacaoViewModalProps) {
  const { user } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInputText, setCommentInputText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getSensibilizacaoById(docId).then(d => {
      setDoc(d);
      setLoading(false);
    }).catch(() => setLoading(false));
    loadComments();
    loadLikes();
  }, [isOpen, docId]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/comment/sensibilizacao/${docId}`, {
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
      const response = await fetch(`/api/interactions/like/sensibilizacao/${docId}`, {
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
      await addInteractionComment(docId, 'sensibilizacao', commentInputText.trim());
      setCommentInputText('');
      toast.success('Comentário adicionado!');
      await loadComments();
      if (window?.dispatchEvent) window.dispatchEvent(new Event('feedShouldRefresh'));
    } catch (e) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleLikeClick = async () => {
    try {
      await addInteractionLike(docId, 'sensibilizacao');
      await loadLikes();
      if (window?.dispatchEvent) window.dispatchEvent(new Event('feedShouldRefresh'));
    } catch (e) {
      toast.error('Erro ao registar gosto');
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90vw] max-w-[1200px] h-[90vh] flex p-0 overflow-hidden">
        {/* Área principal */}
        <div className="flex-1 flex flex-col min-w-0 overflow-x-auto">
          <DialogHeader className="p-4 border-b flex-shrink-0 relative">
            <DialogTitle className="text-lg truncate text-center">
              {doc ? doc.name : 'Documento PDF'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-grow min-h-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">A carregar...</div>
            ) : doc && doc.pdfUrl ? (
              <PDFViewer url={doc.pdfUrl} className="h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-red-500">PDF não encontrado.</div>
            )}
          </div>
        </div>
        {/* Zona lateral de comentários e likes */}
        <div className="w-[280px] border-l bg-gray-50 h-full flex flex-col">
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
              placeholder="Comente..."
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