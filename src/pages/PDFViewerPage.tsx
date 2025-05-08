import React from 'react';
import { PDFViewer } from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';

export default function PDFViewerPage() {
  const location = useLocation();
  const params = useParams();
  const searchParams = new URLSearchParams(location.search);
  const url = searchParams.get('url');
  const title = searchParams.get('title');

  if (!url) {
    return (
      <Layout>
        <div className="min-h-screen h-full w-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Erro ao carregar PDF
            </h1>
            <p className="text-gray-600 mb-4">
              URL do documento não fornecida
            </p>
            <Link to="/acidentes">
              <Button variant="default" className="rounded-full bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold px-6 py-2">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar para Acidentes
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen h-full w-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link to="/acidentes">
                <Button variant="ghost" size="sm" className="rounded-full">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              {title && (
                <h1 className="text-xl font-bold text-gray-800">
                  {title}
                </h1>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            <PDFViewer 
              url={url} 
              className="w-full h-[70vh] rounded-lg border bg-gray-50 shadow-inner" 
            />
          </div>
        </div>
      </div>
    </Layout>
  );
} 