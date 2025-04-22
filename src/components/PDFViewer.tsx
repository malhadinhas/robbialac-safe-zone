import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Button } from '@/components/ui/button'; // Assuming Button component exists

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  className?: string;
  containerWidth?: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, className = '', containerWidth }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page on new document load
    setError(null);
    setIsLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Erro ao carregar documento PDF:', error);
    setError(`Erro ao carregar PDF: ${error.message}`);
    setIsLoading(false);
  }
  
  function onPageLoadSuccess() {
      // Optional: Can do something when a page successfully renders
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  return (
    <div className={`w-full h-full flex flex-col items-center bg-gray-50 dark:bg-gray-800 ${className}`}>
      {error && (
        <div className="flex items-center justify-center h-full text-red-500 p-4 text-center">
          <p>{error}</p>
        </div>
      )}
      
      {!error && (
         <div className="flex-grow w-full overflow-auto flex justify-center items-start">
           <Document
             file={url}
             onLoadSuccess={onDocumentLoadSuccess}
             onLoadError={onDocumentLoadError}
             loading={
               <div className="flex items-center justify-center h-full">
                 <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-robbialac"></div>
               </div>
             }
             className="max-w-full"
           >
             <Page 
                key={`page_${pageNumber}`}
                pageNumber={pageNumber} 
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg max-w-full"
                onLoadSuccess={onPageLoadSuccess}
                width={containerWidth ? containerWidth : undefined}
                loading={
                   <div className="flex items-center justify-center h-60">
                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-robbialac"></div>
                   </div>
                }
             />
           </Document>
         </div>
       )}

      {!isLoading && !error && numPages && numPages > 1 && (
        <div className="flex items-center justify-center gap-4 p-3 border-t bg-background w-full">
          <Button
            variant="outline"
            onClick={previousPage}
            disabled={pageNumber <= 1}
          >
            <FaChevronLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <span>
            Página {pageNumber} de {numPages}
          </span>
          <Button
            variant="outline"
            onClick={nextPage}
            disabled={pageNumber >= numPages}
          >
            Próximo <FaChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}; 