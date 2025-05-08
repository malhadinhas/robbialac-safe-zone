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
import { SensibilizacaoViewModal } from './SensibilizacaoViewModal';

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

  // NEW: State for selected document ID
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

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

  const openDetailModal = (doc: SensibilizacaoTypeFromAPI) => {
    setSelectedDocId(doc._id!);
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
            openDetailModal(docToOpen);
            // Limpar o state para não reabrir ao navegar internamente
            navigate(location.pathname, { replace: true, state: {} }); 
        }
      }
    }
  }, [loading, displayedSensibilizacoes, docIdFromUrl, location.state, navigate]); // Dependências

  return (
    <Layout>
      <div className="h-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto">
        <div className="container mx-auto">
          {/* Header Section */}
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                Sensibilização
              </h1>
              {hasAddPermission && (
            <Button
              onClick={() => setShowAddModal(true)}
                  className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg"
            >
                  <FaPlus className="mr-2" />
                  Novo Documento
            </Button>
          )}
            </div>
        </div>

          {/* Content Section */}
          <div className="mt-6">
          {loading ? (
              <div className="flex justify-center items-center py-10">
                <p>Carregando...</p>
            </div>
            ) : sensibilizacoes.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Nenhum documento de sensibilização encontrado.</p>
            </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sensibilizacoes.map((doc) => (
                  <div
                    key={doc._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col cursor-pointer hover:ring-2 hover:ring-[#1E90FF]"
                    onClick={() => openDetailModal(doc)}
                  >
                    {/* PDF Preview */}
                    <div className="w-full aspect-[4/3] bg-gray-100">
                      <PdfPreview url={doc.pdfUrl} />
                    </div>
                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{doc.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">{doc.country}</span>
                        <span>{format(new Date(doc.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
                      <div className="flex items-center justify-end mt-auto space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full hover:bg-blue-50 ${doc.userHasLiked ? 'text-blue-600' : 'text-gray-400'}`}
                          onClick={e => { e.stopPropagation(); handleLikeClick(doc._id!); }}
                          aria-label="Gosto"
                        >
                          <FaThumbsUp />
                          <span className="ml-1 text-base">{doc.likeCount || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full hover:bg-blue-50"
                          onClick={e => { e.stopPropagation(); openDetailModal(doc); }}
                          aria-label="Comentários"
                        >
                          <FaComment />
                          <span className="ml-1 text-base">{doc.commentCount || 0}</span>
                        </Button>
                        {hasDeletePermission && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-red-50"
                            onClick={e => { e.stopPropagation(); handleDeleteSensibilizacao(doc._id!); }}
                          >
                            <FaTrash className="h-5 w-5 text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
            </div>

        {/* Add Modal */}
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Documento de Sensibilização</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="name">Nome do Documento</Label>
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
                  onClick={handleAddSensibilizacao}
                className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full"
              >
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* PDF Modal */}
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

        {/* Comments Modal */}
        <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Comentários - {selectedDocForComments?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Comments List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {selectedDocForComments && comments.get(selectedDocForComments._id)?.map((comment, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comment.user.name}</span>
                      <span className="text-sm text-gray-500">
                        {format(new Date(comment.createdAt || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.text}</p>
                  </div>
                ))}
              </div>

              {/* Comment Input */}
              <div className="flex space-x-2">
                <Input
                  value={commentInputText}
                  onChange={(e) => setCommentInputText(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="flex-1"
                />
                <Button
                  onClick={handleCommentSubmit}
                  className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full"
                >
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <SensibilizacaoViewModal
          isOpen={!!selectedDocId}
          onClose={() => setSelectedDocId(null)}
          docId={selectedDocId || ''}
        />
      </div>
    </Layout>
  );
}

export { SensibilizacaoComponent as Sensibilizacao }; 