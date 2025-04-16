import React, { useEffect, useRef } from 'react';
import { PDFJS } from '../utils/pdfConfig';
import '../styles/pdfviewer.css';

interface PDFViewerProps {
  pdfUrl: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ pdfUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPDF = async () => {
      try {
        const pdf = await PDFJS.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale: 1 });
        const context = canvas.getContext('2d');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context!,
          viewport: viewport
        }).promise;
      } catch (error) {
        console.error('Erro ao carregar o PDF:', error);
      }
    };

    loadPDF();
  }, [pdfUrl]);

  return (
    <div className="pdf-viewer">
      <canvas ref={canvasRef} />
    </div>
  );
};

export default PDFViewer; 