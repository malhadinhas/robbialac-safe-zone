import { useState, useEffect } from 'react';
import { getSecureR2Url } from '@/services/videoService';
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from 'lucide-react'; // Ícone para erro

interface VideoThumbnailProps {
  thumbnailR2Key: string | null | undefined;
  altText?: string;
}

const VideoThumbnail = ({ thumbnailR2Key, altText = 'Thumbnail' }: VideoThumbnailProps) => {
  
  // --- REMOVER LOG DE PROP ---
  // console.warn(`[VideoThumbnail] Renderizando. Prop thumbnailR2Key recebida:`, thumbnailR2Key);
  // -----------------------------------
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state if key changes
    setThumbnailUrl(null);
    setIsLoading(true);
    setError(null);

    if (!thumbnailR2Key) {
      // console.warn('VideoThumbnail: thumbnailR2Key não fornecida para', altText);
      setError('Thumbnail key não fornecida.');
      setIsLoading(false);
      return;
    }

    let isMounted = true; // Flag para evitar updates após desmontar
    // console.log(`VideoThumbnail: Buscando URL para ${altText}`, { thumbnailR2Key });

    const fetchUrl = async () => {
      // --- REMOVER LOG TEMPORÁRIO --- 
      // console.warn(`[VideoThumbnail] ==> Tentando buscar URL para key: ${thumbnailR2Key}`);
      try {
        const url = await getSecureR2Url(thumbnailR2Key);
        // --- REMOVER LOG TEMPORÁRIO --- 
        // console.warn(`[VideoThumbnail] URL obtida com sucesso para key ${thumbnailR2Key}:`, url ? url.substring(0, 50) + '...' : 'URL VAZIA/NULLA');
        if (isMounted) {
          // console.log(`VideoThumbnail: URL obtida para ${altText}`);
          setThumbnailUrl(url);
        }
      } catch (err) {
        // --- REMOVER LOG TEMPORÁRIO --- 
        // console.error(`[VideoThumbnail] !!! Erro ao buscar URL para key: ${thumbnailR2Key}`, err);
        if (isMounted) {
          setError('Falha ao carregar thumbnail.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUrl();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [thumbnailR2Key]); // Dependência: refetch se a key mudar

  if (isLoading) {
    // Usar Skeleton enquanto carrega
    return <Skeleton className="aspect-video w-full h-full" />;
  }

  if (error || !thumbnailUrl) {
    // Mostrar indicador de erro
    return (
      <div className="aspect-video w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
        <AlertTriangle size={24} aria-label={error || 'Erro ao carregar'}/>
      </div>
    );
  }

  // Exibir a imagem
  return (
    <img 
      src={thumbnailUrl} 
      alt={altText} 
      className="aspect-video w-full h-full object-cover" // Garantir que cobre a área
      loading="lazy" // Otimização: carregar só quando visível
      onError={() => setError('Falha ao exibir imagem.')} // Handler para erro de imagem quebrada
    />
  );
};

export default VideoThumbnail; 