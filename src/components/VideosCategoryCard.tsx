
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video } from "@/types";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { getLastViewedVideosByCategory, getNextVideoToWatch } from '@/services/videoService';
import { useAuth } from "@/contexts/AuthContext";

interface VideosCategoryCardProps {
  category: string;
  description: string;
}

const VideosCategoryCard = ({ category, description }: VideosCategoryCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lastViewedVideo, setLastViewedVideo] = useState<Video | null>(null);
  const [nextVideo, setNextVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        if (user) {
          // Get last viewed video for this category
          const lastViewed = await getLastViewedVideosByCategory(category, 1);
          if (lastViewed.length > 0) {
            setLastViewedVideo(lastViewed[0]);
          }
          
          // Get next recommended video
          const next = await getNextVideoToWatch(category, user.viewedVideos || []);
          if (next) {
            setNextVideo(next);
          }
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [category, user]);

  const handleViewAll = () => {
    toast.info("Selecione uma zona primeiro");
  };

  const handleWatchVideo = (video: Video) => {
    navigate(`/videos/visualizar/${video.id}`);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{category}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-gray-600 mb-4 break-words">{description}</p>
        
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {lastViewedVideo && (
              <div className="relative group">
                <div className="font-medium text-sm text-gray-500 mb-1">Último assistido:</div>
                <div 
                  onClick={() => handleWatchVideo(lastViewedVideo)}
                  className="p-3 border rounded flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-grow overflow-hidden">
                    <h4 className="font-medium text-sm line-clamp-1">{lastViewedVideo.title}</h4>
                    <p className="text-xs text-gray-500">{Math.floor(lastViewedVideo.duration / 60)}:{(lastViewedVideo.duration % 60).toString().padStart(2, '0')}</p>
                  </div>
                  <div className="bg-robbialac text-white rounded-full p-1.5 opacity-80 group-hover:opacity-100 flex-shrink-0 ml-2">
                    <Play size={16} />
                  </div>
                </div>
              </div>
            )}
            
            {nextVideo && (
              <div className="relative group">
                <div className="font-medium text-sm text-gray-500 mb-1">Sugestão próximo:</div>
                <div 
                  onClick={() => handleWatchVideo(nextVideo)}
                  className="p-3 border rounded flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-grow overflow-hidden">
                    <h4 className="font-medium text-sm line-clamp-1">{nextVideo.title}</h4>
                    <p className="text-xs text-gray-500">{Math.floor(nextVideo.duration / 60)}:{(nextVideo.duration % 60).toString().padStart(2, '0')}</p>
                  </div>
                  <div className="bg-robbialac text-white rounded-full p-1.5 opacity-80 group-hover:opacity-100 flex-shrink-0 ml-2">
                    <Play size={16} />
                  </div>
                </div>
              </div>
            )}
            
            {!lastViewedVideo && !nextVideo && (
              <div className="text-center py-4 text-gray-500">
                <p>Nenhum vídeo disponível</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={handleViewAll}>
          Ver Todos
        </Button>
      </CardFooter>
    </Card>
  );
};

export default VideosCategoryCard;
