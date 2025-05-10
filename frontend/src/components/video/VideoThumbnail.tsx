import { useState, useEffect } from 'react';
import { getSecureR2Url } from '@/services/videoService';
import logger from '@/utils/logger';
import { Skeleton } from '@/components/ui/skeleton'; // Para mostrar enquanto carrega

interface VideoThumbnailProps {
  thumbnailKey: string; // Recebe a chave R2
  alt: string;
  className?: string;
}

export function VideoThumbnail({ thumbnailKey, alt, className }: VideoThumbnailProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchUrl = async () => {
      if (!thumbnailKey) {
        logger.warn('VideoThumbnail: Chave da miniatura vazia ou inválida.');
        setError(true);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(false);
      try {
        const url = await getSecureR2Url(thumbnailKey);
        if (isMounted) {
          setSignedUrl(url);
        }
      } catch (err) {
        logger.error('VideoThumbnail: Erro ao buscar URL segura para a miniatura', { key: thumbnailKey, error: err });
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false; // Cleanup para evitar set state em componente desmontado
    };
  }, [thumbnailKey]); // Re-executar se a chave mudar

  if (isLoading) {
    // Mostrar um skeleton enquanto a URL carrega
    return <Skeleton className={className} />;
  }

  if (error || !signedUrl) {
    // Mostrar uma imagem padrão ou placeholder em caso de erro
    // Idealmente, teríamos uma imagem placeholder nos assets
    return (
      <div className={`${className} flex items-center justify-center bg-gray-200 text-gray-500`}>
        <span className="text-xs">Erro</span>
      </div>
    );
  }

  // Renderizar a imagem com a URL assinada obtida
  return (
    <img 
      src={signedUrl} 
      alt={alt}
      className={className}
      crossOrigin="anonymous" // Manter para CORS
      onError={(e) => {
        logger.error(`VideoThumbnail: Erro ao carregar imagem da URL assinada`, { 
          src: signedUrl, 
          key: thumbnailKey,
          errorEvent: e 
        });
        setError(true); // Marca como erro se o carregamento da imagem falhar
      }}
    />
  );
} 