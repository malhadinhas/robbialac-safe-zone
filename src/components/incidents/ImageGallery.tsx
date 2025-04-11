
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  if (!images || images.length === 0) {
    return null;
  }
  
  return (
    <>
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">Imagens ({images.length})</p>
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <img 
                src={image} 
                alt={`Imagem ${index + 1}`} 
                className="w-20 h-20 object-cover rounded-md border border-gray-200"
              />
            </div>
          ))}
        </div>
      </div>
      
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] p-0 overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            {selectedImage && (
              <div className="flex items-center justify-center h-full">
                <img 
                  src={selectedImage} 
                  alt="Visualização ampliada" 
                  className="max-h-[80vh] max-w-full object-contain"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
