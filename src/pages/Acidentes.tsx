import React, { useState, useEffect } from 'react';
import { Accident } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { FaPlus, FaFilePdf, FaTrash } from 'react-icons/fa';
import { getAccidents, createAccident, deleteAccident } from '../services/accidentService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { addInteractionLike } from '@/services/interactionService';
import { AcidenteViewModal } from '@/components/acidentes/AcidenteViewModal';

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

const Acidentes: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAccident, setNewAccident] = useState<Partial<Accident>>({
    name: '',
    country: 'Portugal', // Valor padrão
    date: new Date(),
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAccident, setSelectedAccident] = useState<Accident | null>(null);
  const [openComments, setOpenComments] = useState(false);

  // Verificar permissões do usuário
  const hasAddPermission = user?.role === 'admin_qa' || user?.role === 'admin_app';
  const hasDeletePermission = user?.role === 'admin_qa';

  useEffect(() => {
    loadAccidents();
  }, []);

  const loadAccidents = async () => {
    try {
      const accidentsList = await getAccidents();
      setAccidents(accidentsList);
    } catch (error) {
      toast.error('Erro ao carregar acidentes');
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
    setNewAccident(prev => ({ ...prev, country: value }));
  };

  const handleAddAccident = async () => {
    try {
      if (!newAccident.name || newAccident.name.trim() === '') {
        toast.error('Por favor, insira um nome para o acidente');
        return;
      }
      
      if (!selectedFile) {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }

      const formData = new FormData();
      formData.append('name', newAccident.name || '');
      formData.append('country', newAccident.country || '');
      formData.append('date', newAccident.date?.toISOString() || new Date().toISOString());
      formData.append('document', selectedFile);

      if (formData.has('document')) {
        const file = formData.get('document') as File;
        formData.append('file', file);
      }

      toast("A processar o upload e a criar o acidente...");
      console.log("Enviando formulário para criar acidente:", {
        nome: newAccident.name,
        país: newAccident.country,
        data: newAccident.date
      });
      
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
      console.error("Erro ao adicionar acidente:", error);
      toast.error('Erro ao adicionar acidente');
    }
  };

  const handleDeleteAccident = async (id: string) => {
    try {
      // Verificar permissões novamente como medida de segurança
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

  const handleViewPDF = (accident: Accident) => {
    if (accident.pdfUrl) {
      router.push(`/pdf-viewer/${accident._id}?url=${encodeURIComponent(accident.pdfUrl)}&title=${encodeURIComponent(accident.name)}`);
    } else {
      toast.error('URL do PDF não encontrada para este acidente.');
    }
  };

  const handleLikeClick = async (accident: Accident) => {
    if (!accident._id) {
      toast.error('ID inválido para like');
      return;
    }
    try {
      await addInteractionLike(accident._id, 'accident');
      loadAccidents();
      if (window?.dispatchEvent) window.dispatchEvent(new Event('feedShouldRefresh'));
    } catch (e) {
      toast.error('Erro ao gostar do acidente');
    }
  };

  const openCommentsModal = (accident: Accident) => {
    setSelectedAccident(accident);
    setOpenComments(true);
    setIsViewModalOpen(true);
  };

  const handleCardClick = (accident: Accident) => {
    setSelectedAccident(accident);
    setOpenComments(false);
    setIsViewModalOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen h-full w-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto">
        {/* Header Section */}
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

        {/* Content Section */}
        <div className="mt-6 flex justify-center items-start min-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-10 w-full">
              <p>Carregando...</p>
            </div>
          ) : accidents.length === 0 ? (
            <div className="text-center py-10 w-full">
              <p className="text-gray-500">Nenhum acidente registrado.</p>
             </div>
          ) : (
            // Se houver apenas um acidente (detalhe)
            accidents.length === 1 ? (
              <div className="w-full max-w-2xl">
                <div className="bg-white rounded-2xl shadow-xl transition-all overflow-hidden flex flex-col">
                  <div className="p-6 pb-2 border-b">
                    <h3 className="text-2xl font-bold text-gray-800 mb-1">{accidents[0].name}</h3>
                    <div className="flex items-center text-base text-gray-500 mb-4">
                      <span className="mr-4 font-medium">País: {accidents[0].country}</span>
                      <span>Data: {format(new Date(accidents[0].date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="w-full flex justify-center items-center bg-[#f7faff] p-6">
                    {accidents[0].pdfUrl ? (
                      <div className="w-full flex justify-center">
                        <FaFilePdf className="h-40 w-40 text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500">PDF não disponível</p>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col gap-4 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full hover:bg-blue-50`}
                          onClick={() => handleLikeClick(accidents[0])}
                          aria-label="Gosto"
                        >
                          <span className="text-gray-400">👍</span>
                          <span className="ml-1 text-base">{accidents[0].likeCount || 0}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`rounded-full hover:bg-blue-50`}
                          onClick={() => openCommentsModal(accidents[0])}
                          aria-label="Comentários"
                        >
                          <span className="text-gray-400">💬</span>
                          <span className="ml-1 text-base">{accidents[0].commentCount || 0}</span>
                        </Button>
                      </div>
                      <Button
                        className="rounded-full bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold px-6 py-2 shadow-lg flex items-center gap-2"
                        onClick={() => handleCardClick(accidents[0])}
                      >
                        <FaFilePdf className="h-5 w-5" />
                        Ver Documento Completo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {accidents.map((accident) => (
                  <div
                    key={accident._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden flex flex-col"
                  >
                    {/* PDF Preview */}
                    <div className="w-full aspect-[4/3] bg-gray-100">
                      {accident.pdfUrl ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaFilePdf className="h-16 w-16 text-gray-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-gray-500">PDF não disponível</p>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">{accident.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <span className="mr-4">{accident.country}</span>
                        <span>{format(new Date(accident.date), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center space-x-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full hover:bg-blue-50`}
                            onClick={() => handleLikeClick(accident)}
                            aria-label="Gosto"
                          >
                            <span className="text-gray-400">👍</span>
                            <span className="ml-1 text-base">{accident.likeCount || 0}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`rounded-full hover:bg-blue-50`}
                            onClick={() => openCommentsModal(accident)}
                            aria-label="Comentários"
                          >
                            <span className="text-gray-400">💬</span>
                            <span className="ml-1 text-base">{accident.commentCount || 0}</span>
                          </Button>
                        </div>
                        <Button
                          className="rounded-full bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold px-6 py-2 shadow-lg flex items-center gap-2"
                          onClick={() => handleCardClick(accident)}
                        >
                          <FaFilePdf className="h-5 w-5" />
                          Ver Documento Completo
                        </Button>
                      </div>
                    </div>
                </div>
              ))}
            </div>
            )
          )}
      </div>

        {/* Add Modal */}
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

      {isViewModalOpen && selectedAccident && (
        <AcidenteViewModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setOpenComments(false);
          }}
          accidentId={selectedAccident._id}
          openComments={openComments}
        />
      )}
      </div>
    </Layout>
  );
};

export default Acidentes; 