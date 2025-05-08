'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Accident } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { FaPlus, FaTrash, FaExternalLinkAlt, FaThumbsUp, FaComment, FaChevronLeft, FaFilePdf } from 'react-icons/fa';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { getAccidents, deleteAccident, createAccident } from '@/services/accidentService';
import { addInteractionLike, removeInteractionLike, addInteractionComment } from '@/services/interactionService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { useAuth } from '@/contexts/AuthContext';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

export function Acidentes() {
  const { user } = useAuth();
  const { id: docIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAccident, setNewAccident] = useState<Partial<Accident>>({
    name: '',
    country: 'Portugal',
    date: new Date(),
  });

  const hasAddPermission = user?.role === 'admin_qa' || user?.role === 'admin_app';
  const hasDeletePermission = user?.role === 'admin_qa';

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrlInModal, setPdfUrlInModal] = useState<string | null>(null);
  const [pdfTitleInModal, setPdfTitleInModal] = useState<string>('');

  const [selectedAccidentId, setSelectedAccidentId] = useState<string | null>(null);
  const [openCommentsOnModal, setOpenCommentsOnModal] = useState(false);

  useEffect(() => {
    loadAccidents();
  }, []);

  const loadAccidents = async () => {
    setLoading(true);
    try {
      const accidentsList: Accident[] = await getAccidents();
      setAccidents(accidentsList);
    } catch (error) {
      toast.error('Erro ao carregar acidentes');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else if (file) {
      toast.error('Por favor, selecione apenas arquivos PDF');
    }
  };

  const handleCountryChange = (value: Country) => {
    setNewAccident(prev => ({ ...prev, country: value }));
  };

  const handleAddAccident = async () => {
    try {
      if (!selectedFile) {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }
      if (!newAccident.name || newAccident.name.trim() === '') {
        toast.error('Por favor, insira um nome para o acidente');
        return;
      }
      const formData = new FormData();
      formData.append('name', newAccident.name || '');
      formData.append('country', newAccident.country || 'Portugal');
      const dateToSend = newAccident.date instanceof Date ? newAccident.date.toISOString() : new Date().toISOString();
      formData.append('date', dateToSend);
      formData.append('document', selectedFile);
      toast("A processar o upload e a criar o acidente...");
      await createAccident(formData);
      setShowAddModal(false);
      setNewAccident({ name: '', country: 'Portugal', date: new Date() });
      setSelectedFile(null);
      loadAccidents();
      toast.success('Acidente adicionado com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar acidente');
    }
  };

  const handleDeleteAccident = async (id: string) => {
    try {
      if (!hasDeletePermission) {
        toast.error('Você não tem permissão para excluir acidentes');
      return;
    }
      await deleteAccident(id);
      toast.success('Acidente removido com sucesso');
      loadAccidents();
    } catch (error) {
      toast.error('Erro ao remover acidente');
    }
  };

  const displayedAccidents = useMemo(() => {
    if (docIdFromUrl) {
      const singleDoc = accidents.find(doc => doc._id === docIdFromUrl);
      return singleDoc ? [singleDoc] : [];
    } else {
      return accidents;
    }
  }, [accidents, docIdFromUrl]);

  const openPdfModal = (url: string, title: string) => {
    setPdfUrlInModal(url);
    setPdfTitleInModal(title);
    setPdfModalOpen(true);
  };

  const handleLikeClick = async (id: string) => {
    const idx = accidents.findIndex(a => a._id === id);
    if (idx === -1) return;
    const accident = accidents[idx];
    const originalLiked = accident.userHasLiked || false;
    const originalCount = accident.likeCount || 0;
    // Atualização otimista
    const updatedAccidents = [...accidents];
    updatedAccidents[idx] = {
      ...accident,
      userHasLiked: !originalLiked,
      likeCount: Math.max(0, originalLiked ? originalCount - 1 : originalCount + 1)
    };
    setAccidents(updatedAccidents);
    try {
      await addInteractionLike(id, 'accident');
    } catch (error) {
      // Reverter se der erro
      const reverted = [...accidents];
      reverted[idx] = accident;
      setAccidents(reverted);
      toast.error('Erro ao gostar do acidente');
    }
  };

  // Callback para atualizar comentários após adicionar um novo comentário na modal
  const handleCommentAdded = (accidentId: string) => {
    const idx = accidents.findIndex(a => a._id === accidentId);
    if (idx === -1) return;
    const updatedAccidents = [...accidents];
    updatedAccidents[idx] = {
      ...accidents[idx],
      commentCount: (accidents[idx].commentCount || 0) + 1
    };
    setAccidents(updatedAccidents);
  };

  const openDetailModal = (accident: Accident) => {
    navigate(`/acidentes/${accident._id}`);
  };

  const openCommentsModal = (accident: Accident) => {
    navigate(`/acidentes/${accident._id}`);
  };

  return (
    <Layout>
      <div className="min-h-screen h-full w-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto">
        <div className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
              Acidentes
            </h1>
            {hasAddPermission && (
            <Button
              onClick={() => setShowAddModal(true)}
                className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg"
            >
                <FaPlus className="mr-2" />
                Novo Acidente
            </Button>
          )}
          </div>
        </div>
        <div className="mt-6 flex justify-center items-start min-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-10 w-full">
              <p>Carregando...</p>
            </div>
          ) : displayedAccidents.length === 0 ? (
            <div className="text-center py-10 w-full">
              <p className="text-gray-500">Nenhum acidente registrado.</p>
            </div>
          ) : (
            displayedAccidents.length === 1 ? (
              <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl shadow-xl transition-all overflow-hidden flex flex-col">
                  <div className="p-6 pb-2 border-b">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{displayedAccidents[0].name}</h3>
                    <div className="flex items-center text-base text-gray-500 mb-4">
                      <span className="mr-4 font-medium">País: {displayedAccidents[0].country}</span>
                      <span>Data: {format(new Date(displayedAccidents[0].date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="w-full flex flex-col items-center justify-center cursor-pointer hover:ring-2 hover:ring-[#1E90FF]"
                    onClick={() => displayedAccidents[0].pdfUrl && window.open(displayedAccidents[0].pdfUrl, '_blank')}
                    style={{ minHeight: 320 }}
                  >
                    {displayedAccidents[0].pdfUrl ? (
                      <Document file={displayedAccidents[0].pdfUrl} loading={<FaFilePdf className='h-40 w-40 text-gray-300' />} error={<FaFilePdf className='h-40 w-40 text-red-400' />} className="w-full h-full">
                        <Page pageNumber={1} width={undefined} height={undefined} className="w-full h-full object-contain" renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                    ) : (
                      <FaFilePdf className="h-40 w-40 text-gray-300" />
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full hover:bg-blue-50 ${displayedAccidents[0].userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                          onClick={e => { e.stopPropagation(); handleLikeClick(displayedAccidents[0]._id!); }}
                          aria-label="Gosto"
                        >
                          <FaThumbsUp />
                          <span className="ml-1 text-base">{displayedAccidents[0].likeCount || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-blue-50"
                          onClick={e => { e.stopPropagation(); openCommentsModal(displayedAccidents[0]); }}
                          aria-label="Comentários"
                        >
                          <FaComment />
                          <span className="ml-1 text-base">{displayedAccidents[0].commentCount || 0}</span>
                        </Button>
                      </div>
                      <Button
                        className="rounded-full bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold px-6 py-2 shadow-lg flex items-center gap-2"
                        onClick={() => window.open(displayedAccidents[0].pdfUrl, '_blank')}
                      >
                        <FaExternalLinkAlt className="h-5 w-5" />
                        Ver Documento Completo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {displayedAccidents.map((accident) => (
                  <div
                    key={accident._id}
                    className={"bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-[#1E90FF]"}
                    onClick={() => accident.pdfUrl && openDetailModal(accident)}
                    style={{ minHeight: 320 }}
                  >
                    <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                      {accident.pdfUrl ? (
                        <Document file={accident.pdfUrl} loading={<FaFilePdf className='h-16 w-16 text-gray-300' />} error={<FaFilePdf className='h-16 w-16 text-red-400' />} className="w-full h-full">
                          <Page pageNumber={1} width={undefined} height={undefined} className="w-full h-full object-contain" renderTextLayer={false} renderAnnotationLayer={false} />
                        </Document>
                      ) : (
                        <FaFilePdf className="h-16 w-16 text-gray-300" />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{accident.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">{accident.country}</span>
                        <span>{format(new Date(accident.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center justify-end mt-auto space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full hover:bg-blue-50 ${accident.userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                          onClick={e => { e.stopPropagation(); handleLikeClick(accident._id!); }}
                          aria-label="Gosto"
                        >
                          <FaThumbsUp />
                          <span className="ml-1 text-base">{accident.likeCount || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-blue-50"
                          onClick={e => { e.stopPropagation(); openCommentsModal(accident); }}
                          aria-label="Comentários"
                        >
                          <FaComment />
                          <span className="ml-1 text-base">{accident.commentCount || 0}</span>
                        </Button>
                        {hasDeletePermission && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-50"
                            onClick={e => { e.stopPropagation(); handleDeleteAccident(accident._id!); }}
                          >
                            <FaTrash className="h-5 w-5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
             <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Acidente</DialogTitle>
             </DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                 <Label htmlFor="name">Nome do Acidente</Label>
                 <Input
                   id="name"
                   value={newAccident.name}
                   onChange={(e) => setNewAccident(prev => ({ ...prev, name: e.target.value }))}
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label htmlFor="country">País</Label>
                 <Select
                   value={newAccident.country}
                   onValueChange={handleCountryChange}
                 >
                   <SelectTrigger id="country" className="mt-1">
                    <SelectValue placeholder="Selecione o país" />
                   </SelectTrigger>
                   <SelectContent>
                    {COUNTRIES.map((country) => (
                       <SelectItem key={country.value} value={country.value}>
                         {country.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                <Label htmlFor="document">Arquivo PDF</Label>
                 <Input
                  id="document"
                   type="file"
                  accept=".pdf"
                   onChange={handleFileChange}
                   className="mt-1"
                 />
              </div>
               </div>
            <div className="flex justify-end space-x-2">
                 <Button
                variant="outline"
                   onClick={() => setShowAddModal(false)}
                className="rounded-full"
                 >
                   Cancelar
                 </Button>
                  <Button
                onClick={handleAddAccident}
                className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full"
                  >
                Adicionar
                  </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
          <DialogContent className="max-w-6xl w-[95vw] h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{pdfTitleInModal}</DialogTitle>
            </DialogHeader>
            {pdfUrlInModal && (
              <div className="flex-1 overflow-auto">
                <PDFViewer url={pdfUrlInModal} />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 