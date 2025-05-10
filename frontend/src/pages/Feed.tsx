import { useState, useEffect, MouseEvent } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, AlertTriangle, FileText, ThumbsUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFeedActivity, FeedItem } from '@/services/feedService';

// --- List Item Components ---

const ListItemCard: React.FC<{
  item: FeedItem;
  onClick: (item: FeedItem, openComments?: boolean) => void;
}> = ({ item, onClick }) => {
  let displayDate = 'Data inválida';
  try {
    const parsedDate = new Date(item.date);
    if (!isNaN(parsedDate.getTime())) {
      displayDate = formatDistanceToNow(parsedDate, { addSuffix: true, locale: ptBR });
    } else {
      console.warn("Invalid date string received:", item.date);
    }
  } catch (e) {
    console.error("Error formatting date:", item.date, e);
  }

  const getIconForItem = (type: 'qa' | 'document') => {
    switch (type) {
      case 'qa': return <AlertTriangle size={20} />;
      case 'document': return <FileText size={20} />;
      default: return null;
    }
  };

  const getDocumentTag = (docType: 'Acidente' | 'Sensibilizacao' | undefined) => {
    if (!docType) return null;
    const isAcidente = docType === 'Acidente';
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${isAcidente ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
            {docType}
        </span>
    );
  };

  // Handler específico para a área de interações
  const handleInteractionAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation(); // Impedir que o clique na área de comentários dispare o clique da card principal
    onClick(item, true); // Chamar onClick com openComments = true
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => onClick(item, false)}>
      <CardContent className="p-3 flex flex-col gap-2">
        {/* Top part: Icon, Title, Date, Document Tag */}
        <div className="flex items-start gap-3">
          <div className="text-robbialac flex-shrink-0 mt-0.5">{getIconForItem(item.type)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={item.title}>{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {displayDate}
            </p>
          </div>
          {item.type === 'document' && (
            <div className="ml-auto flex-shrink-0">{getDocumentTag(item.documentType)}</div>
          )}
        </div>
        
        {/* Envolver a secção de likes/comments num div com onClick específico */}
        {(item.likeCount !== undefined || item.commentCount !== undefined) && (item.likeCount > 0 || item.commentCount > 0) && (
           <div 
             className="flex items-center gap-4 pt-2 border-t border-dashed mt-1 cursor-pointer"
             onClick={handleInteractionAreaClick}
           >
              {item.likeCount !== undefined && item.likeCount > 0 && (
                 <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp size={14} className="text-blue-500"/>
                    <span>{item.likeCount}</span>
                 </div>
              )}
              {item.commentCount !== undefined && item.commentCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare size={14} className="text-gray-500"/>
                    <span>{item.commentCount}</span>
                </div>
              )}
           </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function FeedPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    const loadFeedData = async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await getFeedActivity();
        setFeedItems(items);
      } catch (err) {
        console.error("Erro ao carregar dados do feed:", err);
        setError("Não foi possível carregar as novidades. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    loadFeedData();

    // Listener para refresh automático do feed
    const refreshListener = () => loadFeedData();
    window.addEventListener('feedShouldRefresh', refreshListener);
    return () => {
      window.removeEventListener('feedShouldRefresh', refreshListener);
    };
  }, []);

  // Navigation Handler - Modificado para aceitar openComments
  const handleItemClick = (item: FeedItem, openComments: boolean = false) => {
    let path = '';
    if (item.type === 'activity') {
      // Se for uma atividade de like ou comentário, navega para o item associado
      if (item.documentType === 'Quase Acidente') {
        path = `/quase-acidentes/${item._id}`;
      } else if (item.documentType === 'Acidente') {
        path = `/acidentes/${item._id}`;
      } else if (item.documentType === 'Sensibilizacao') {
        path = `/sensibilizacao/${item._id}`;
      } else {
        console.warn("Document type unknown for navigation:", item.documentType);
        return; // Não navegar se tipo desconhecido
      }
    } else if (item.type === 'qa') {
      path = `/quase-acidentes/${item._id}`; 
    } else if (item.type === 'document' && item.documentType) {
      if (item.documentType === 'Acidente') {
        path = `/acidentes/${item._id}`;
      } else if (item.documentType === 'Sensibilizacao') {
        path = `/sensibilizacao/${item._id}`; 
      } else {
        console.warn("Document type unknown for navigation:", item.documentType);
        return; // Não navegar se tipo desconhecido
      }
    } else {
      console.warn("Cannot determine navigation path for feed item:", item);
      return; // Não navegar se dados incompletos
    }
    
    // Navegar, passando o estado openComments se for true
    navigate(path, { state: { openComments } });
  };

  return (
    <Layout>
      <div className="h-full flex flex-col p-4 sm:p-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h1 className="text-xl sm:text-2xl font-bold">Feed de Novidades</h1>
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Unified Feed List Area */}
        <div className="flex-grow overflow-y-auto pb-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : error ? (
              <div className="text-center text-red-600 bg-red-50 p-4 rounded-md">
                  {error}
              </div>
          ) : feedItems.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Nenhuma novidade recente.</p>
          ) : (
            <div className="space-y-2"> 
              {feedItems.map(item => (
                <ListItemCard
                  key={item._id} 
                  item={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 