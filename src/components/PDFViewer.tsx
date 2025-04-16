import React from 'react';

interface PDFViewerProps {
  url: string;
  className?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, className = '' }) => {
  return (
    <div className={`w-full h-[600px] ${className}`}>
      <iframe
        src={url}
        className="w-full h-full border rounded-lg shadow-sm"
        title="PDF Viewer"
      />
    </div>
  );
}; 