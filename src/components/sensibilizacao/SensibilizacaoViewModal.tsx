import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { useEffect, useState } from 'react';
import { getSensibilizacaoById } from '@/services/sensibilizacaoService';

interface SensibilizacaoViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  openComments?: boolean;
}

export function SensibilizacaoViewModal({ isOpen, onClose, docId }: SensibilizacaoViewModalProps) {
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getSensibilizacaoById(docId).then(d => {
      setDoc(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [isOpen, docId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-6xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="p-4 border-b flex-shrink-0 relative">
          <DialogTitle className="text-lg truncate text-center">
            {doc ? doc.name : 'Documento PDF'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">A carregar...</div>
          ) : doc && doc.pdfUrl ? (
            <PDFViewer url={doc.pdfUrl} className="h-full" />
          ) : (
            <div className="flex items-center justify-center h-full text-red-500">PDF não encontrado.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 