import { useState, useEffect, MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, ThumbsUp, MessageSquare, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFeedActivity, FeedItem } from '@/services/feedService';
import { Button } from '@/components/ui/button';
// Importar modais
import { QuaseAcidentesViewModal } from '@/components/incidents/QuaseAcidentesViewModal';

// Componente para exibir um item do feed
const FeedItemCard: React.FC<{
  item: FeedItem;
  onClick: (item: FeedItem, openComments?: boolean) => void;
}> = ({ item, onClick }) => {
  const getIcon = () => {
    if (item.type === 'activity') {
      return item.action === 'like' ? <ThumbsUp className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />;
    }
    switch (item.type) {
      case 'qa':
        return <AlertTriangle className="h-4 w-4" />;
      case 'document': 
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    if (item.type === 'activity') {
      return item.action === 'like'
        ? `${item.userName} gostou de ${item.title}`
        : `${item.userName} comentou em ${item.title}`;
    }
    return item.title;
  };

  const getSubtitle = () => {
    if (item.type === 'activity' && item.action === 'comment' && item.commentText) {
      return item.commentText;
    }
    return item.documentType || '';
  };

  return (
    <div 
      className="p-2 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onClick(item, item.type === 'activity' && item.action === 'comment')}
    >
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {getTitle()}
          </p>
          <p className="text-xs text-gray-500 truncate">
            {getSubtitle()}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  );
};

export function FeedCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Estado para modais
  const [qaModalId, setQaModalId] = useState<string | null>(null);
  const [sensibilizacaoModalId, setSensibilizacaoModalId] = useState<string | null>(null);
  const [openComments, setOpenComments] = useState(false);

  useEffect(() => {
    const loadFeedData = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getFeedActivity(5); // Buscamos apenas 5 items para o dashboard
        setFeedItems(items);
      } catch (err) {
        console.error("Erro ao carregar dados do feed:", err);
        setError("Não foi possível carregar as novidades.");
      } finally {
        setLoading(false);
      }
    };
    loadFeedData();
  }, []);

  // Handler de click atualizado
  const handleItemClick = (item: FeedItem, openCommentsParam: boolean = false) => {
    setOpenComments(openCommentsParam);
    if (item.type === 'qa') {
      setQaModalId(item._id);
    } else if (item.type === 'document' && item.documentType) {
      if (item.documentType === 'Acidente') {
        navigate(`/acidentes/${item._id}`);
      } else if (item.documentType === 'Sensibilizacao') {
        navigate(`/sensibilizacao/${item._id}`);
      }
    } else if (item.type === 'video') {
      navigate(`/videos/visualizar/${item._id}`);
    }
  };

  // Fechar modais
  const closeAllModals = () => {
    setQaModalId(null);
    setSensibilizacaoModalId(null);
    setOpenComments(false);
  };

  return (
    <>
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Feed de Atividades</CardTitle>
          <Button 
            variant="link" 
            className="p-0 h-auto" 
            onClick={() => navigate('/feed')}
          >
            Ver todos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="py-0 px-2">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-robbialac"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 p-2 text-sm">
            {error}
          </div>
        ) : feedItems.length === 0 ? (
          <p className="text-center text-muted-foreground py-4 text-sm">Nenhuma atividade recente</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedItems.map(item => (
              <FeedItemCard 
                key={item._id} 
                item={item} 
                onClick={handleItemClick} 
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
      {/* Modais QA */}
      {qaModalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="w-1/2 h-full bg-white shadow-lg">
            <QuaseAcidentesViewModal 
              isOpen={!!qaModalId} 
              onClose={closeAllModals} 
              incidentId={qaModalId} 
              openComments={openComments}
            />
          </div>
        </div>
      )}
    </>
  );
} 