import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFPreviewProps {
  url: string;
  className?: string;
}

export function PDFPreview({ url, className = '' }: PDFPreviewProps) {
  const [error, setError] = useState(false);

  return (
    <div className={`relative w-full aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {!error ? (
        <Document
          file={url}
          onLoadError={(error) => {
            console.error('Erro ao carregar PDF:', error);
            setError(true);
          }}
          loading={
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Page
            pageNumber={1}
            width={300}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            }
          />
        </Document>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          <p className="text-sm">Erro ao carregar prévia</p>
        </div>
      )}
    </div>
  );
} 