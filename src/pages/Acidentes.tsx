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
import { NoScrollLayout } from '@/components/NoScrollLayout';
import { useAuth } from '@/contexts/AuthContext';

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
    router.push(`/pdf-viewer/${accident._id}?url=${encodeURIComponent(accident.pdfUrl)}&title=${encodeURIComponent(accident.name)}`);
  };

  return (
    <Layout>
      <NoScrollLayout>
        <div className="h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Acidentes</h1>
            {hasAddPermission && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-robbialac hover:bg-robbialac-dark text-white"
              >
                <FaPlus className="mr-2" /> Adicionar Acidente
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[calc(100%-4rem)]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {accidents.map((accident) => (
                <div key={accident._id} className="bg-white border rounded-md p-1.5">
                  <div className="flex justify-between items-start gap-1 mb-1">
                    <h2 className="text-[13px] leading-tight font-medium line-clamp-1">{accident.name}</h2>
                    {hasDeletePermission && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAccident(accident._id!)}
                        className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                      >
                        <FaTrash className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-0.5 mb-1.5">
                    <p className="text-[11px] text-gray-600 leading-tight">
                      <span className="font-medium">País:</span> {accident.country}
                    </p>
                    <p className="text-[11px] text-gray-600 leading-tight">
                      <span className="font-medium">Data:</span> {format(new Date(accident.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center gap-1 text-robbialac hover:text-robbialac-dark text-[11px] h-6 px-2"
                    onClick={() => handleViewPDF(accident)}
                  >
                    <FaFilePdf className="h-3 w-3" /> Ver PDF
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="max-w-[98vw] sm:max-w-lg h-[98vh] sm:h-auto p-2 sm:p-4 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-xl">Adicionar Novo Acidente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name" className="text-xs sm:text-sm font-medium">Nome do Acidente</Label>
                  <Input
                    id="name"
                    value={newAccident.name}
                    onChange={(e) => setNewAccident(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-xs sm:text-sm font-medium">País</Label>
                  <Select value={newAccident.country} onValueChange={handleCountryChange}>
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
                  <Label htmlFor="pdf" className="text-xs sm:text-sm font-medium">Documento PDF</Label>
                  <Input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="mt-1"
                  />
                  {selectedFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddModal(false)}
                    className="text-xs sm:text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleAddAccident}
                    className="bg-robbialac hover:bg-robbialac-dark text-white text-xs sm:text-sm"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </NoScrollLayout>
    </Layout>
  );
};

export default Acidentes; 