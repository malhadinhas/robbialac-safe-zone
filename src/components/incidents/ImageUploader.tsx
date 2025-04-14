import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { fileToBase64, captureImage } from "@/services/incidentService";

interface ImageUploaderProps {
  onImagesSelected: (images: File[]) => void;
  onImagesChange?: (images: string[]) => void;
  images?: string[];
  maxImages?: number;
}

// Função para redimensionar imagens
const resizeImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calcular novas dimensões mantendo a proporção
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round(width * maxHeight / height);
          height = maxHeight;
        }
      }
      
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(base64Str); // Se não conseguir redimensionar, retorna a imagem original
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Converter para JPEG com qualidade reduzida
      const newBase64 = canvas.toDataURL("image/jpeg", quality);
      resolve(newBase64);
    };
    img.onerror = () => {
      resolve(base64Str); // Se houver erro, retorna a imagem original
    };
  });
};

export default function ImageUploader({ 
  onImagesSelected, 
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
      const fileArray = Array.from(files);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith("image/")) {
          // Converter para base64
          const base64 = await fileToBase64(file);
          
          // Redimensionar a imagem
          const resizedBase64 = await resizeImage(base64);
          
          newImages.push(resizedBase64);
          
          // Verificar tamanho após redimensionamento
          const sizeInMB = (resizedBase64.length * 0.75) / 1024 / 1024; // Estimativa de tamanho em MB
          if (sizeInMB > 8) {
            toast.warning(`A imagem ${file.name} ainda é grande (${sizeInMB.toFixed(2)}MB). Considere usar uma imagem menor.`);
          }
        }
      }
      
      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
      
      // Support both callback methods
      if (onImagesChange) {
        onImagesChange(updatedImages);
      }
      onImagesSelected(fileArray);
      
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
        // Redimensionar a imagem capturada
        const resizedBase64 = await resizeImage(base64Image);
        
        const updatedImages = [...uploadedImages, resizedBase64];
        setUploadedImages(updatedImages);
        
        // Support both callback methods
        if (onImagesChange) {
          onImagesChange(updatedImages);
        }
        // For camera captures, we don't have actual File objects to pass
        // But we need to call the function for API consistency
        onImagesSelected([]);
        
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
    
    if (onImagesChange) {
      onImagesChange(updatedImages);
    }
    // For image removal, we don't have actual File objects to pass
    // But we need to call the function for API consistency
    onImagesSelected([]);
    
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
