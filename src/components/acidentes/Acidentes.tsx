'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Accident } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { FaPlus, FaTrash, FaExternalLinkAlt, FaThumbsUp, FaComment, FaChevronLeft } from 'react-icons/fa';
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
  const location = useLocation();
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
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfUrlInModal, setPdfUrlInModal] = useState<string | null>(null);
  const [pdfTitleInModal, setPdfTitleInModal] = useState<string>('');

  const [comments, setComments] = useState<Map<string, { _id?: string; user: { _id: string, name: string }; text: string; createdAt?: Date }[]>>(new Map());
  const [commentInputText, setCommentInputText] = useState<string>('');
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [selectedAccidentForComments, setSelectedAccidentForComments] = useState<Accident | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [mobilePdfWidth, setMobilePdfWidth] = useState<number | undefined>();

  const hasAddPermission = user?.role === 'admin_qa' || user?.role === 'admin_app';
  const hasDeletePermission = user?.role === 'admin_qa';

  useEffect(() => {
    loadAccidents();

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
          setMobilePdfWidth(window.innerWidth - 32);
      } else {
          setMobilePdfWidth(undefined);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);

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
      console.error("Erro ao remover acidente:", error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        toast.error('Sem permissão para excluir este acidente');
      } else {
        toast.error('Erro ao remover acidente');
      }
    }
  };

  const openPdfModal = (url: string, title: string) => {
    setPdfUrlInModal(url);
    setPdfTitleInModal(title);
    setModalOpen(true);
  };

  const PdfPreview = ({ url }: { url: string }) => {
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [numPagesPreview, setNumPagesPreview] = useState<number | null>(null);

    const onPreviewLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
      setNumPagesPreview(numPages);
      setPreviewError(null);
    }, []);

    const onPreviewLoadError = useCallback((error: Error) => {
      console.error("Erro ao carregar pré-visualização do PDF:", error);
      setPreviewError("Não foi possível carregar a pré-visualização.");
    }, []);

    return (
      <div className="border rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto w-full">
        {previewError ? (
          <p className="text-red-500 text-xs p-2 text-center">{previewError}</p>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onPreviewLoadSuccess}
            onLoadError={onPreviewLoadError}
            loading={<div className="text-xs text-gray-500">A carregar pré-visualização...</div>}
            error={<div className="text-xs text-red-500 p-2">Erro ao carregar</div>}
            className="max-w-full max-h-full flex justify-center items-center"
          >
            {numPagesPreview ? (
              <Page
                pageNumber={1}
                width={450}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="max-w-full max-h-full"
                loading={null}
                error={null}
              />
            ) : (
              !previewError && <div className="text-xs text-gray-500">A carregar...</div>
            )}
          </Document>
        )}
      </div>
    );
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
      setNewAccident({
        name: '',
        country: 'Portugal',
        date: new Date(),
      });
      setSelectedFile(null);
      loadAccidents();
      toast.success('Acidente adicionado com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar acidente');
      console.error("Erro detalhado ao adicionar acidente:", error);
    }
  };

  const handleLikeClick = async (accidentId: string) => {
    if (!user) {
      toast.info("Precisa de fazer login para dar gosto.");
      return;
    }
    const docIndex = accidents.findIndex(d => d._id === accidentId);
    if (docIndex === -1) return;

    const doc = accidents[docIndex];
    const originalLiked = doc.userHasLiked || false;
    const originalCount = doc.likeCount || 0;

    const updatedAccidents = [...accidents];
    updatedAccidents[docIndex] = {
      ...doc,
      userHasLiked: !originalLiked,
      likeCount: Math.max(0, originalLiked ? originalCount - 1 : originalCount + 1)
    };
    setAccidents(updatedAccidents);

    try {
      if (originalLiked) {
        await removeInteractionLike(accidentId, 'accident');
      } else {
        await addInteractionLike(accidentId, 'accident');
      }
    } catch (error) {
      toast.error("Erro ao atualizar gosto.");
      const revertedAccidents = [...accidents];
      revertedAccidents[docIndex] = {
        ...doc,
        userHasLiked: originalLiked,
        likeCount: originalCount
      };
       setAccidents(revertedAccidents); 
    }
  };

  const openCommentsModal = (accident: Accident) => {
    setSelectedAccidentForComments(accident);
    setCommentInputText('');
    setShowCommentsModal(true);
  };

  const handleCommentSubmit = async () => {
    if (!selectedAccidentForComments || !selectedAccidentForComments._id) return;
    const docId = selectedAccidentForComments._id;
    const text = commentInputText;

    if (!user) {
      toast.info("Precisa de fazer login para comentar.");
      return;
    }

    if (!text || text.trim() === '') {
      toast.warning("O comentário não pode estar vazio.");
      return;
    }

    try {
      const newCommentData = await addInteractionComment(docId, 'accident', text.trim());

      setComments(prev => {
        const newMap = new Map(prev);
        const currentComments = newMap.get(docId) || [];
        newMap.set(docId, [...currentComments, newCommentData]);
        return newMap;
      });
      
      const docIndex = accidents.findIndex(d => d._id === docId);
       if (docIndex !== -1) {
          const updatedAccidents = [...accidents];
          updatedAccidents[docIndex] = {
             ...updatedAccidents[docIndex],
             commentCount: (updatedAccidents[docIndex].commentCount || 0) + 1
          };
          setAccidents(updatedAccidents);
       }

      setCommentInputText('');
      toast.success("Comentário adicionado!");
      setShowCommentsModal(false);

      if (isMobile) {
        navigate('/acidentes');
      }

    } catch (error) {
      toast.error("Erro ao adicionar comentário.");
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

  useEffect(() => {
    if (!loading && displayedAccidents.length === 1 && docIdFromUrl) {
      const shouldOpenComments = location.state?.openComments;
      if (shouldOpenComments) {
        const docToOpen = displayedAccidents[0];
        if (docToOpen) {
            console.log(`Tentando abrir comentários para acidente ${docIdFromUrl} devido ao state da navegação.`);
            openCommentsModal(docToOpen);
            navigate(location.pathname, { replace: true, state: {} }); 
        }
      }
    }
  }, [loading, displayedAccidents, docIdFromUrl, location.state, navigate]);

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2 p-2 border-b flex-shrink-0">
          {docIdFromUrl && (
            <Button variant="outline" size="icon" onClick={() => navigate('/acidentes')} className="mr-2">
               <FaChevronLeft />
            </Button>
          )}
          <div className={`flex-1 ${docIdFromUrl ? '' : 'text-center'}`}> 
            <h1 className="text-xl font-semibold">Acidentes</h1>
          </div>
          {!docIdFromUrl && hasAddPermission && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-robbialac hover:bg-robbialac-dark text-white"
              size="sm"
            >
              <FaPlus className="mr-1" /> Adicionar Acidente
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto px-1 py-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : displayedAccidents.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {docIdFromUrl ? 'Acidente não encontrado.' : 'Nenhum acidente encontrado.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6 lg:w-3/4 xl:w-2/3 mx-auto py-4">
              {displayedAccidents.map((doc) => (
                <div key={doc._id} className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
                  <div className="p-3 sm:p-4 border-b bg-card-foreground/5">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h2 className="flex-1 text-base sm:text-lg font-semibold leading-tight text-center truncate pr-2">{doc.name}</h2>
                      {hasDeletePermission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAccident(doc._id!)}
                          className="text-destructive hover:text-destructive/80 h-7 w-7 p-0 flex-shrink-0"
                          aria-label="Remover Acidente"
                        >
                          <FaTrash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground mt-1">
                      <p><span className="font-medium">País:</span> {doc.country}</p>
                      <p><span className="font-medium">Data:</span> {format(new Date(doc.date), 'dd/MM/yyyy', { locale: ptBR })}</p>
                    </div>
                  </div>

                  <div className={`px-3 sm:px-4 py-2 flex-grow ${isMobile ? 'min-h-[60vh]' : ''}`}>
                    {doc.pdfUrl ? (
                       isMobile ? (
                           <PDFViewer url={doc.pdfUrl} className="w-full h-full" containerWidth={mobilePdfWidth} />
                       ) : (
                           <PdfPreview url={doc.pdfUrl} />
                       )
                    ) : (
                      <div className="text-center text-muted-foreground text-sm p-4">Documento PDF não disponível.</div>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 bg-card-foreground/5">
                    <div className="flex items-center gap-4">
                      <Button
                         variant="ghost" 
                         size="sm" 
                         className={`text-muted-foreground hover:text-primary ${doc.userHasLiked ? 'text-blue-600 hover:text-blue-700' : ''}`}
                         onClick={() => handleLikeClick(doc._id!)}
                         disabled={!user}
                      >
                        <FaThumbsUp className="h-4 w-4 mr-1" />
                        <span className="text-sm mr-1">Gosto</span>
                        <span className="text-sm font-medium">({doc.likeCount || 0})</span> 
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => openCommentsModal(doc)}
                      >
                        <FaComment className="h-4 w-4 mr-1" />
                        <span className="text-sm">Comentar</span>
                        <span className="text-sm font-medium ml-1">({doc.commentCount || 0})</span>
                      </Button>
                    </div>
                    {!isMobile && doc.pdfUrl && (
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm"
                        onClick={() => openPdfModal(doc.pdfUrl!, doc.name)}
                        disabled={!doc.pdfUrl}
                      >
                        <FaExternalLinkAlt className="h-3 w-3" /> Ver Documento Completo
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isMobile && (
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-6xl h-[90vh] p-0 flex flex-col">
                <DialogHeader className="p-4 border-b flex-shrink-0 relative">
                  <DialogTitle className="text-lg truncate text-center">{pdfTitleInModal || 'Documento PDF'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                   {pdfUrlInModal && (
                       <PDFViewer url={pdfUrlInModal} className="h-full" />
                   )}
                </div>
              </DialogContent>
            </Dialog>
        )}

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
           <DialogContent className="max-w-[98vw] sm:max-w-lg h-auto max-h-[95vh] p-3 sm:p-4 overflow-y-auto">
             <DialogHeader>
               <DialogTitle>Adicionar Novo Acidente</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
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
                     <SelectValue placeholder="Selecione um país" />
                   </SelectTrigger>
                   <SelectContent>
                     {COUNTRIES.map(country => (
                       <SelectItem key={country.value} value={country.value}>
                         {country.label}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label htmlFor="date">Data</Label>
                 <Input
                   id="date"
                   type="date"
                   value={newAccident.date ? format(newAccident.date, 'yyyy-MM-dd') : ''}
                   onChange={(e) => setNewAccident(prev => ({ ...prev, date: new Date(e.target.value) }))}
                   className="mt-1"
                 />
               </div>
               <div>
                 <Label htmlFor="pdf">Arquivo PDF</Label>
                 <Input
                   id="pdf"
                   type="file"
                   accept="application/pdf"
                   onChange={handleFileChange}
                   className="mt-1"
                 />
                 {selectedFile && (
                   <p className="text-sm text-gray-500 mt-1">
                     Arquivo selecionado: {selectedFile.name}
                   </p>
                 )}
               </div>
               <div className="mt-6 flex justify-end gap-4">
                 <Button
                   variant="ghost"
                   onClick={() => setShowAddModal(false)}
                 >
                   Cancelar
                 </Button>
                 <Button onClick={handleAddAccident} className="bg-robbialac hover:bg-robbialac-dark text-white">
                   Salvar
                 </Button>
               </div>
             </div>
           </DialogContent>
        </Dialog>

        <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
          <DialogContent className="max-w-lg h-[70vh] flex flex-col">
            <DialogHeader className="p-4 border-b flex-shrink-0 relative">
              <DialogTitle className="text-lg truncate text-center">Comentários sobre: {selectedAccidentForComments?.name || 'Acidente'}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {(comments.get(selectedAccidentForComments?._id || '') || []).length > 0 ? (
                (comments.get(selectedAccidentForComments?._id || '') || []).map((comment, index) => (
                  <div key={comment._id || index} className="text-sm bg-background p-2 rounded shadow-sm border">
                    <div className="flex justify-between items-center mb-1">
                       <span className="font-semibold text-primary mr-2">{comment.user?.name || 'Utilizador Anónimo'}</span>
                       {comment.createdAt && (
                          <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), 'dd/MM/yy HH:mm', { locale: ptBR })}</span>
                       )}
                    </div>
                    <p className="text-foreground/90 whitespace-pre-wrap break-words">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">Ainda não há comentários.</p>
              )}
            </div>
            <div className="p-4 border-t mt-auto flex-shrink-0">
              {user ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Adicione um comentário..."
                    className="flex-grow text-sm"
                    value={commentInputText}
                    onChange={(e) => setCommentInputText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    onClick={handleCommentSubmit}
                    className="text-xs"
                    disabled={!commentInputText.trim()}
                  >
                    Enviar
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Faça login para comentar.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 