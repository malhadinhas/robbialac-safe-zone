'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sensibilizacao as SensibilizacaoType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FaPlus, FaFilePdf, FaTrash, FaChevronLeft, FaChevronRight, FaExternalLinkAlt, FaThumbsUp, FaComment } from 'react-icons/fa';
import { getSensibilizacoes, createSensibilizacao, deleteSensibilizacao } from '@/services/sensibilizacaoService';
import { toggleSensibilizacaoLike, addSensibilizacaoComment } from '@/services/interactionService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { toast } from "sonner";
import { useAuth } from '@/contexts/AuthContext';
import { pdfjs, Document, Page } from 'react-pdf';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

interface SensibilizacaoTypeFromAPI extends SensibilizacaoType {
  likeCount?: number;
  commentCount?: number;
  userHasLiked?: boolean;
}

export function SensibilizacaoComponent() {
  const { user } = useAuth();
  const { id: docIdFromUrl } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [sensibilizacoes, setSensibilizacoes] = useState<SensibilizacaoTypeFromAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newSensibilizacao, setNewSensibilizacao] = useState<Partial<SensibilizacaoType>>({
    name: '',
    country: 'Portugal',
    date: new Date(),
  });

  // State for PDF Modal
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrlInModal, setPdfUrlInModal] = useState<string | null>(null);
  const [pdfTitleInModal, setPdfTitleInModal] = useState<string>('');

  // State for Likes and Comments
  const [comments, setComments] = useState<Map<string, { _id?: string; user: { _id: string, name: string }; text: string; createdAt?: Date }[]>>(new Map());
  const [commentInputText, setCommentInputText] = useState<string>('');
  const [showCommentsModal, setShowCommentsModal] = useState<boolean>(false);
  const [selectedDocForComments, setSelectedDocForComments] = useState<SensibilizacaoTypeFromAPI | null>(null);

  // NEW: State for mobile detection
  const [isMobile, setIsMobile] = useState(false);
  // NEW: State to store calculated width for mobile PDF viewer
  const [mobilePdfWidth, setMobilePdfWidth] = useState<number | undefined>();

  // Verificar se o usuário tem permissão para adicionar documentos
  const hasAddPermission = user?.role === 'admin_qa' || user?.role === 'admin_app';
  
  // Verificar se o usuário tem permissão para excluir documentos (apenas admin_qa)
  const hasDeletePermission = user?.role === 'admin_qa';

  useEffect(() => {
    loadSensibilizacoes();

    // NEW: Mobile detection logic
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Calculate width for PDF viewer on mobile, considering parent padding (px-1) and card padding (px-3)
      if (mobile) {
          setMobilePdfWidth(window.innerWidth - 32); // Adjust if padding differs
      } else {
          setMobilePdfWidth(undefined);
      }
    };
    checkMobile(); // Check on initial load
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile); // Cleanup listener

  }, []);

  const loadSensibilizacoes = async () => {
    setLoading(true);
    try {
      const sensibilizacoesList: SensibilizacaoTypeFromAPI[] = await getSensibilizacoes();
      setSensibilizacoes(sensibilizacoesList);

    } catch (error) {
      toast.error('Erro ao carregar documentos de sensibilização');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Por favor, selecione apenas arquivos PDF');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleCountryChange = (value: Country) => {
    setNewSensibilizacao(prev => ({ ...prev, country: value }));
  };

  const handleAddSensibilizacao = async () => {
    try {
      if (!newSensibilizacao.name || newSensibilizacao.name.trim() === '') {
        toast.error('Por favor, insira um nome para o documento');
        return;
      }
      
      if (!selectedFile) {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }

      const formData = new FormData();
      formData.append('name', newSensibilizacao.name || '');
      formData.append('country', newSensibilizacao.country || 'Portugal');
      formData.append('date', newSensibilizacao.date?.toISOString() || new Date().toISOString());
      formData.append('document', selectedFile);

      toast("A processar o upload e a criar o documento...");
      console.log("Enviando formulário para criar documento de sensibilização:", {
        nome: newSensibilizacao.name,
        país: newSensibilizacao.country,
        data: newSensibilizacao.date
      });
      
      await createSensibilizacao(formData);
      setShowAddModal(false);
      setNewSensibilizacao({
        name: '',
        country: 'Portugal',
        date: new Date(),
      });
      setSelectedFile(null);
      loadSensibilizacoes();
    } catch (error) {
      console.error("Erro ao adicionar documento de sensibilização:", error);
    }
  };

  const handleDeleteSensibilizacao = async (id: string) => {
    try {
      if (!hasDeletePermission) {
        toast.error('Você não tem permissão para excluir documentos de sensibilização');
        return;
      }
      
      await deleteSensibilizacao(id);
      toast.success('Documento removido com sucesso');
      loadSensibilizacoes();
    } catch (error) {
      console.error("Erro ao remover documento:", error);
      
      // Se for um erro de permissão
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        toast.error('Sem permissão para excluir este documento');
      } else {
        toast.error('Erro ao remover documento');
      }
    }
  };

  // --- PDF Preview Component ---
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

  // --- PDF Modal --- 
  const openPdfModal = (url: string, title: string) => {
    setPdfUrlInModal(url);
    setPdfTitleInModal(title);
    setPdfModalOpen(true);
  };

  // --- Interaction Handlers ---

  const handleLikeClick = async (docId: string) => {
    if (!user) {
      toast.info("Precisa de fazer login para dar gosto.");
      return;
    }
    // Encontrar o documento no state para atualizar otimisticamente
    const docIndex = sensibilizacoes.findIndex(d => d._id === docId);
    if (docIndex === -1) return;

    const doc = sensibilizacoes[docIndex];
    const originalLiked = doc.userHasLiked || false;
    const originalCount = doc.likeCount || 0;

    // Optimistic UI update - Atualizar diretamente a lista
    const updatedSensibilizacoes = [...sensibilizacoes];
    updatedSensibilizacoes[docIndex] = {
      ...doc,
      userHasLiked: !originalLiked,
      likeCount: Math.max(0, originalLiked ? originalCount - 1 : originalCount + 1)
    };
    setSensibilizacoes(updatedSensibilizacoes);

    try {
      // A chamada API agora usa o estado originalLiked corretamente
      await toggleSensibilizacaoLike(docId, originalLiked);
    } catch (error) {
      toast.error("Erro ao atualizar gosto.");
      // Revert UI on error - Reverter a atualização otimista
      const revertedSensibilizacoes = [...sensibilizacoes];
      revertedSensibilizacoes[docIndex] = {
        ...doc,
        userHasLiked: originalLiked,
        likeCount: originalCount
      };
       setSensibilizacoes(revertedSensibilizacoes); 
    }
  };

  const openCommentsModal = (doc: SensibilizacaoTypeFromAPI) => {
    setSelectedDocForComments(doc);
    setCommentInputText('');
    setShowCommentsModal(true);
    // TODO: Idealmente, buscar comentários aqui via API em vez de depender do estado?
    // const commentsForItem = await getInteractionComments(doc._id, 'sensibilizacao');
    // setComments(prev => new Map(prev).set(doc._id!, commentsForItem));
  };

  const handleCommentSubmit = async () => {
    if (!selectedDocForComments || !selectedDocForComments._id) return;
    const docId = selectedDocForComments._id;
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
      const newCommentData = await addSensibilizacaoComment(docId, text.trim());

      // Atualizar a lista de comentários para o modal (se necessário)
      setComments(prev => {
        const newMap = new Map(prev);
        const currentComments = newMap.get(docId) || [];
        newMap.set(docId, [...currentComments, newCommentData]);
        return newMap;
      });
      
      // Atualizar contagem no estado principal (otimista)
      const docIndex = sensibilizacoes.findIndex(d => d._id === docId);
       if (docIndex !== -1) {
          const updatedSensibilizacoes = [...sensibilizacoes];
          updatedSensibilizacoes[docIndex] = {
             ...updatedSensibilizacoes[docIndex],
             commentCount: (updatedSensibilizacoes[docIndex].commentCount || 0) + 1
          };
          setSensibilizacoes(updatedSensibilizacoes);
       }

      setCommentInputText('');
      toast.success("Comentário adicionado!");
      setShowCommentsModal(false);
    } catch (error) {
      toast.error("Erro ao adicionar comentário.");
      // TODO: Reverter atualização otimista da contagem se necessário
    }
  };

  // --- Lógica para determinar quais documentos exibir --- 
  const displayedSensibilizacoes = useMemo(() => {
    if (docIdFromUrl) {
      // Se temos ID na URL, filtrar para mostrar apenas esse
      const singleDoc = sensibilizacoes.find(doc => doc._id === docIdFromUrl);
      return singleDoc ? [singleDoc] : []; // Retorna array com 1 item ou vazio se não encontrado
    } else {
      // Se não temos ID na URL, mostrar todos
      return sensibilizacoes;
    }
  }, [sensibilizacoes, docIdFromUrl]);

  // --- Lógica para abrir comentários na navegação --- 
  useEffect(() => {
    // Só executar depois que os dados estiverem carregados E estivermos na página de detalhe
    if (!loading && displayedSensibilizacoes.length === 1 && docIdFromUrl) {
      const shouldOpenComments = location.state?.openComments;
      if (shouldOpenComments) {
        const docToOpen = displayedSensibilizacoes[0]; // Já sabemos que é o único
        if (docToOpen) {
            console.log(`Tentando abrir comentários para ${docIdFromUrl} devido ao state da navegação.`);
            openCommentsModal(docToOpen);
            // Limpar o state para não reabrir ao navegar internamente
            navigate(location.pathname, { replace: true, state: {} }); 
        }
      }
    }
  }, [loading, displayedSensibilizacoes, docIdFromUrl, location.state, navigate]); // Dependências

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2 p-2 border-b flex-shrink-0">
          {docIdFromUrl && (
             <Button variant="outline" size="icon" onClick={() => navigate('/sensibilizacao')} className="mr-2">
                <FaChevronLeft />
             </Button>
          )}
          <div className={`flex-1 ${docIdFromUrl ? '' : 'text-center'}`}>
            <h1 className="text-xl font-semibold">Sensibilização</h1>
          </div>
          {!docIdFromUrl && hasAddPermission && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-robbialac hover:bg-robbialac-dark text-white"
              size="sm"
            >
              <FaPlus className="mr-1" /> Adicionar Documento
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto px-1 py-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : displayedSensibilizacoes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">
                {docIdFromUrl ? 'Documento não encontrado.' : 'Nenhum documento de sensibilização encontrado.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-6 lg:w-3/4 xl:w-2/3 mx-auto py-4">
              {displayedSensibilizacoes.map((doc) => (
                <div key={doc._id} className="bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
                  <div className="p-3 sm:p-4 border-b bg-card-foreground/5">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h2 className="flex-1 text-base sm:text-lg font-semibold leading-tight text-center truncate pr-2">{doc.name}</h2>
                      {hasDeletePermission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteSensibilizacao(doc._id!)}
                          className="text-destructive hover:text-destructive/80 h-7 w-7 p-0 flex-shrink-0"
                          aria-label="Remover Documento"
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
                           // Render full PDF viewer directly on mobile, passing calculated width
                           <PDFViewer url={doc.pdfUrl} className="w-full h-full" containerWidth={mobilePdfWidth} />
                       ) : (
                           // Render preview on desktop/tablet
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

        {/* PDF Viewer Modal (only used on non-mobile) */}
        {!isMobile && (
            <Dialog open={pdfModalOpen} onOpenChange={setPdfModalOpen}>
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

        <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
          <DialogContent className="max-w-lg h-[70vh] flex flex-col">
            <DialogHeader className="p-4 border-b flex-shrink-0 relative">
              <DialogTitle className="text-lg truncate text-center">Comentários sobre: {selectedDocForComments?.name || 'Documento'}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {(comments.get(selectedDocForComments?._id || '') || []).length > 0 ? (
                (comments.get(selectedDocForComments?._id || '') || []).map((comment, index) => (
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

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-[98vw] sm:max-w-lg h-auto max-h-[95vh] p-3 sm:p-4 overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Documento de Sensibilização</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newSensibilizacao.name}
                  onChange={(e) => setNewSensibilizacao(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="country">País</Label>
                <Select
                  value={newSensibilizacao.country}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger id="country" className="mt-1">
                    <SelectValue placeholder="Selecione um país" />
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
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={newSensibilizacao.date ? format(new Date(newSensibilizacao.date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewSensibilizacao(prev => ({ ...prev, date: new Date(e.target.value) }))}
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
                <Button
                  onClick={handleAddSensibilizacao}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Salvar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

export { SensibilizacaoComponent as Sensibilizacao }; 