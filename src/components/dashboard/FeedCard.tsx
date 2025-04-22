import { useState, useEffect, MouseEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, ThumbsUp, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getFeedActivity, FeedItem } from '@/services/feedService';
import { Button } from '@/components/ui/button';

// Componente para exibir um item do feed
const FeedItemCard: React.FC<{
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

  const getIconForItem = () => {
    switch (item.type) {
      case 'qa': return <AlertTriangle size={16} className="text-amber-500" />;
      case 'document': 
        return item.documentType === 'Acidente' 
          ? <AlertTriangle size={16} className="text-red-500" />
          : <FileText size={16} className="text-blue-500" />;
      default: return null;
    }
  };

  // Handler para a área de interações
  const handleInteractionAreaClick = (event: MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    onClick(item, true);
  };

  return (
    <div 
      className="p-2 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 cursor-pointer transition-all"
      onClick={() => onClick(item, false)}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">{getIconForItem()}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium line-clamp-1" title={item.title}>{item.title}</p>
          <p className="text-xs text-muted-foreground">{displayDate}</p>
          
          {(item.likeCount || item.commentCount) && (
            <div 
              className="flex items-center gap-3 mt-1 cursor-pointer"
              onClick={handleInteractionAreaClick}
            >
              {item.likeCount && item.likeCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ThumbsUp size={12} className="text-blue-500"/>
                  <span>{item.likeCount}</span>
                </div>
              )}
              {item.commentCount && item.commentCount > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageSquare size={12} className="text-gray-500"/>
                  <span>{item.commentCount}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {item.type === 'document' && item.documentType && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ml-auto ${
            item.documentType === 'Acidente' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {item.documentType}
          </span>
        )}
      </div>
    </div>
  );
};

export function FeedCard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

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

  // Navegação para o item clicado
  const handleItemClick = (item: FeedItem, openComments: boolean = false) => {
    let path = '';
    if (item.type === 'qa') {
      path = `/quase-acidentes/${item._id}`; 
    } else if (item.type === 'document' && item.documentType) {
      path = item.documentType === 'Acidente' 
        ? `/acidentes/${item._id}`
        : `/sensibilizacao/${item._id}`;
    } else {
      return; // Não navegar se dados incompletos
    }
    
    navigate(path, { state: { openComments } });
  };

  return (
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
  );
} 