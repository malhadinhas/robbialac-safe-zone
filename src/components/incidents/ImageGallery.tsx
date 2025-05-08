import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  showOnlyFirstImage?: boolean;
  className?: string;
  showControls?: boolean;
}

export default function ImageGallery({ 
  images, 
  showOnlyFirstImage = false, 
  className = "",
  showControls = false
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const mouseDownX = useRef<number | null>(null);
  const mouseDragging = useRef<boolean>(false);
  
  if (!images || images.length === 0) {
    return null;
  }
  
  const handleImageClick = (image: string, index: number) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setZoomLevel(1);
  };
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => {
      const newIndex = (prev - 1 + images.length) % images.length;
      setSelectedImage(images[newIndex]);
      return newIndex;
    });
    setZoomLevel(1);
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => {
      const newIndex = (prev + 1) % images.length;
      setSelectedImage(images[newIndex]);
      return newIndex;
    });
    setZoomLevel(1);
  };
  
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };
  
  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };
  
  // Funções de swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const delta = touchStartX.current - touchEndX.current;
      if (Math.abs(delta) > 50) {
        if (delta > 0) handleNextImage({ stopPropagation: () => {} } as any);
        else handlePrevImage({ stopPropagation: () => {} } as any);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };
  // Mouse drag (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownX.current = e.clientX;
    mouseDragging.current = true;
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mouseDragging.current || mouseDownX.current === null) return;
    const delta = mouseDownX.current - e.clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) handleNextImage({ stopPropagation: () => {} } as any);
      else handlePrevImage({ stopPropagation: () => {} } as any);
      mouseDragging.current = false;
      mouseDownX.current = null;
    }
  };
  const handleMouseUp = () => {
    mouseDragging.current = false;
    mouseDownX.current = null;
  };
  
  return (
    <>
      <div className={`${className} ${!showOnlyFirstImage ? 'mt-4' : ''}`}>
        {!showOnlyFirstImage && !showControls && <p className="text-sm font-medium mb-2">Imagens ({images.length})</p>}
        
        {showControls && images.length > 0 ? (
          <div
            className="relative"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: 'grab' }}
          >
            <div className="flex items-center justify-center bg-slate-100 rounded-md overflow-hidden" style={{ minHeight: "300px" }}>
              <img 
                src={images[currentImageIndex]} 
                alt={`Imagem ${currentImageIndex + 1} de ${images.length}`} 
                className="max-w-full max-h-[500px] object-contain cursor-pointer"
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-in-out' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/placeholder-image.png';
                }}
                onClick={() => setSelectedImage(images[currentImageIndex])}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                draggable={false}
              />
            </div>
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </>
            )}
            
            {/* Zoom controls */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs px-3 py-1.5 rounded-full">
              {currentImageIndex + 1} / {images.length}
            </div>
          </div>
        ) : (
        <div className="flex flex-wrap gap-2">
          {(showOnlyFirstImage ? [images[0]] : images).map((image, index) => (
            <div 
              key={index} 
              className="cursor-pointer"
                onClick={() => handleImageClick(image, index)}
            >
              <img 
                src={image} 
                alt={`Imagem ${index + 1}`} 
                className={`object-cover rounded-md border border-gray-200 ${
                  showOnlyFirstImage ? 'w-16 h-16' : 'w-20 h-20'
                }`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/placeholder-image.png';
                }}
              />
            </div>
          ))}
          {showOnlyFirstImage && images.length > 1 && (
            <div className="flex items-center justify-center w-8 h-16 text-sm text-gray-500 font-medium">
              +{images.length - 1}
            </div>
          )}
        </div>
        )}
        
        {showControls && images.length > 1 && (
          <div className="flex overflow-x-auto gap-2 mt-4 pb-2">
            {images.map((image, index) => (
              <div 
                key={index} 
                className={`cursor-pointer flex-shrink-0 w-16 h-16 border-2 rounded-md overflow-hidden ${
                  index === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img 
                  src={image} 
                  alt={`Miniatura ${index + 1}`} 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/placeholder-image.png';
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      <Dialog open={!!selectedImage} onOpenChange={() => {
        setSelectedImage(null);
        setZoomLevel(1);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <div className="relative h-full">
            <div className="absolute top-2 right-2 z-50 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
            <Button
              variant="ghost"
              size="icon"
                className="bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
              onClick={() => setSelectedImage(null)}
            >
                <X className="h-5 w-5" />
            </Button>
            </div>
            
            <div className="flex items-center justify-center bg-black bg-opacity-90 min-h-[400px] p-4">
            {selectedImage && (
                <img 
                  src={selectedImage} 
                  alt="Visualização ampliada" 
                  className="max-h-[70vh] max-w-full object-contain"
                  style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-in-out' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/src/assets/placeholder-image.png';
                  }}
                />
              )}
            </div>
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full hover:bg-opacity-80"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full">
                  {currentImageIndex + 1} / {images.length}
              </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
