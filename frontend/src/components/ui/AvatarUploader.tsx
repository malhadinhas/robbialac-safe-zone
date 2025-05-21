import { useRef, useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X } from "lucide-react";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface AvatarUploaderProps {
  avatarUrl?: string;
  name?: string;
  onAvatarChange: (base64: string) => void;
}

export default function AvatarUploader({ avatarUrl, name, onAvatarChange }: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | undefined>(avatarUrl);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropper, setShowCropper] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMobileOrTablet = useIsMobile() || useIsTablet();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setCropImage(base64);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 0.8);
        setCropImage(base64);
        setShowCropper(true);
      }
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      alert("Erro ao aceder à câmara");
    }
  };

  const removeAvatar = () => {
    setPreview(undefined);
    onAvatarChange("");
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  async function getCroppedImg(imageSrc: string, crop: any) {
    const image = new window.Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    const size = Math.min(crop.width, crop.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.save();
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(
      image,
      crop.x,
      crop.y,
      size,
      size,
      0,
      0,
      size,
      size
    );
    ctx.restore();
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  const handleCropConfirm = async () => {
    if (cropImage && croppedAreaPixels) {
      const cropped = await getCroppedImg(cropImage, croppedAreaPixels);
      if (cropped) {
        setPreview(cropped);
        onAvatarChange(cropped);
      }
    }
    setShowCropper(false);
    setCropImage(null);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        <Avatar className="w-20 h-20 shadow border-2 border-blue-100">
          {preview ? (
            <AvatarImage src={preview} alt={name || "Avatar"} />
          ) : (
            <AvatarFallback>{name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-white/80 hover:bg-white shadow-md rounded-full p-1 flex items-center justify-center transition-opacity border border-gray-200 opacity-0 group-hover:opacity-100"
            title="Carregar foto"
            style={{ zIndex: 2 }}
          >
            <Camera className="h-5 w-5 text-gray-600" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </button>
          {preview && (
            <button
              className="absolute top-1 left-1 bg-gray-200/70 hover:bg-gray-400/80 text-gray-600 hover:text-gray-800 rounded-full p-1 w-6 h-6 flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity border border-gray-300"
              onClick={removeAvatar}
              title="Remover foto"
              type="button"
              style={{ zIndex: 2 }}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Avatar>
      </div>
      {showCropper && cropImage && (
        <Dialog open={showCropper} onOpenChange={setShowCropper}>
          <DialogContent className="max-w-xs p-0">
            <div className="w-[90vw] max-w-xs h-[350px] flex flex-col items-center justify-center">
              <div className="relative w-full h-56 bg-black rounded-full overflow-hidden">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="w-full flex items-center gap-2 mt-2">
                <span className="text-xs">Zoom</span>
                <Slider min={0.5} max={5} step={0.01} value={[zoom]} onValueChange={v => setZoom(v[0])} />
              </div>
              <div className="flex justify-end w-full mt-4 gap-2">
                <Button variant="ghost" onClick={() => setShowCropper(false)}>Cancelar</Button>
                <Button onClick={handleCropConfirm}>Confirmar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 