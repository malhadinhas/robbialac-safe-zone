import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getSensibilizacaoById } from '@/services/sensibilizacaoService';
import { addInteractionComment, addInteractionLike } from '@/services/interactionService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Layout } from '@/components/Layout';
import { toast } from 'sonner';

export default function SensibilizacaoView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInputText, setCommentInputText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userHasLiked, setUserHasLiked] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSensibilizacaoById(id).then(d => {
      setDoc(d);
      setLoading(false);
    }).catch(() => setLoading(false));
    fetchComments();
    fetchLikes();
  }, [id]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/comment/sensibilizacao/${id}`, {
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

  const fetchLikes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/interactions/like/sensibilizacao/${id}`, {
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
    if (!commentInputText.trim() || !id) return;
    try {
      await addInteractionComment(id, 'sensibilizacao', commentInputText.trim());
      setCommentInputText('');
      toast.success('Comentário adicionado!');
      await fetchComments();
    } catch (e) {
      toast.error('Erro ao adicionar comentário');
    }
  };

  const handleLikeClick = async () => {
    if (!id) return;
    try {
      await addInteractionLike(id, 'sensibilizacao');
      await fetchLikes();
    } catch (e) {
      toast.error('Erro ao registar gosto');
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] bg-[#f7faff] py-8 px-2 sm:px-6">
        <div className="container mx-auto max-w-4xl flex flex-col gap-6">
          {/* Card do Documento */}
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-4 border border-slate-100">
            <div className="mb-1">
              <h1 className="text-lg font-bold break-words leading-tight">{doc?.name || 'Documento de Sensibilização'}</h1>
              <p className="text-gray-600 text-sm">Detalhes do Documento de Sensibilização.</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-lg">A carregar...</div>
            ) : doc && doc.pdfUrl ? (
              <iframe
                src={doc.pdfUrl + '#zoom=68'}
                title="PDF de Sensibilização"
                className="w-full rounded-lg border"
                style={{ minHeight: 600, height: '70vh', background: '#f7faff' }}
              />
            ) : (
              <div className="flex items-center justify-center h-40 text-red-500">PDF não encontrado.</div>
            )}
          </div>
          {/* Card de Comentários */}
          <div className="bg-white rounded-2xl shadow-md p-4 flex flex-col gap-3 border border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-800">Comentários</h3>
              <button
                className={`rounded-full p-2 hover:bg-blue-100 ${userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                onClick={handleLikeClick}
                aria-label="Gosto"
              >
                👍 <span className="ml-1 text-base">{likeCount}</span>
              </button>
            </div>
            <div
              className="flex-1 flex flex-col gap-2 mb-2"
              style={{ maxHeight: 340, overflowY: 'auto' }}
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
                      {comment.user?.name || 'Utilizador'}
                    </span>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 mt-auto">
              <Input
                value={commentInputText}
                onChange={e => setCommentInputText(e.target.value)}
                placeholder="Comente..."
                className="flex-1"
                onKeyDown={e => { if (e.key === 'Enter') handleCommentSubmit(); }}
              />
              <Button
                onClick={handleCommentSubmit}
                className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full"
                disabled={!commentInputText.trim()}
              >
                Enviar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 