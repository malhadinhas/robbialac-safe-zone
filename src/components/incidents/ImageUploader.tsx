
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { fileToBase64, captureImage } from "@/services/incidentService";

interface ImageUploaderProps {
  onImagesChange: (images: string[]) => void;
  images?: string[];
  maxImages?: number;
}

export default function ImageUploader({ 
  onImagesChange, 
  images = [], 
  maxImages = 3 
}: ImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>(images);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobileOrTablet = useIsMobile() || useIsTablet();
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      
      if (uploadedImages.length + files.length > maxImages) {
        toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
        return;
      }
      
      const newImages: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          const base64 = await fileToBase64(file);
          newImages.push(base64);
        }
      }
      
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      onImagesChange(updatedImages);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      if (newImages.length > 0) {
        toast.success(`${newImages.length} imagem(ns) adicionada(s)`);
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Erro ao carregar imagens");
    }
  };
  
  const handleCameraCapture = async () => {
    try {
      if (uploadedImages.length >= maxImages) {
        toast.error(`Você pode adicionar no máximo ${maxImages} imagens`);
        return;
      }
      
      const base64Image = await captureImage();
      
      if (base64Image) {
        const updatedImages = [...uploadedImages, base64Image];
        setUploadedImages(updatedImages);
        onImagesChange(updatedImages);
        toast.success("Imagem capturada com sucesso");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Erro ao capturar imagem");
    }
  };
  
  const removeImage = (index: number) => {
    const updatedImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updatedImages);
    onImagesChange(updatedImages);
    toast.success("Imagem removida");
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {uploadedImages.map((image, index) => (
          <div key={index} className="relative">
            <img 
              src={image} 
              alt={`Upload ${index + 1}`} 
              className="w-20 h-20 object-cover rounded-md"
            />
            <button 
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
              onClick={() => removeImage(index)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          <span>Carregar imagens</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
        </Button>
        
        {isMobileOrTablet && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCameraCapture}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span>Usar câmera</span>
          </Button>
        )}
      </div>
    </div>
  );
}
