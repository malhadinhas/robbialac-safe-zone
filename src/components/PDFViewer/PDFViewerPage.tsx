import React from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';

export function PDFViewerPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const url = searchParams.get('url');
  const title = searchParams.get('title');

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-500 mb-4">
            Erro ao carregar PDF
          </h1>
          <p className="text-gray-600 mb-4">
            URL do documento não fornecida
          </p>
          <Link to="/acidentes">
            <Button variant="default">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar para Acidentes
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/acidentes">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            {title && (
              <h1 className="text-xl font-semibold text-foreground">
                {title}
              </h1>
            )}
          </div>
        </div>
        
        <PDFViewer 
          url={url} 
          className="h-[calc(100vh-8rem)]" 
        />
      </div>
    </div>
  );
} 