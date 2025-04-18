'use client';

import React, { useState, useEffect } from 'react';
import { Accident } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { FaPlus, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getAccidents, deleteAccident, createAccident } from '@/services/accidentService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { useAuth } from '@/contexts/AuthContext';

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

export function Acidentes() {
  const { user } = useAuth();
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAccidentIndex, setCurrentAccidentIndex] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAccident, setNewAccident] = useState<Partial<Accident>>({
    name: '',
    country: 'Portugal',
    date: new Date(),
  });

  // Verificar permissões do usuário
  const hasAddPermission = user?.role === 'admin_qa' || user?.role === 'admin_app';
  const hasDeletePermission = user?.role === 'admin_qa';

  useEffect(() => {
    loadAccidents();
  }, []);

  const loadAccidents = async () => {
    setLoading(true);
    try {
      const accidentsList = await getAccidents();
      setAccidents(accidentsList);
      setCurrentAccidentIndex(prevIndex => 
        accidentsList.length > 0 ? Math.min(prevIndex, accidentsList.length - 1) : 0
      );
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
      // Verificar permissões novamente como medida de segurança
      if (!hasDeletePermission) {
        toast.error('Você não tem permissão para excluir acidentes');
        return;
      }

      await deleteAccident(id);
      toast.success('Acidente removido com sucesso');
      setCurrentAccidentIndex(0);
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

  const handlePreviousAccident = () => {
    setCurrentAccidentIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  const handleNextAccident = () => {
    setCurrentAccidentIndex(prevIndex => Math.min(accidents.length - 1, prevIndex + 1));
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
      formData.append('date', newAccident.date?.toISOString() || new Date().toISOString());
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
      console.error("Erro detalhado:", error);
    }
  };

  const currentAccident = accidents.length > 0 ? accidents[currentAccidentIndex] : null;

  return (
    <Layout>
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-2 p-2 border-b flex-shrink-0">
          <h1 className="text-xl font-semibold">Acidentes</h1>
          {hasAddPermission && (
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-robbialac hover:bg-robbialac-dark text-white"
              size="sm"
            >
              <FaPlus className="mr-1" /> Adicionar Acidente
            </Button>
          )}
        </div>

        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : !currentAccident ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Nenhum acidente encontrado.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="w-full mb-2 p-2 flex justify-between items-center flex-shrink-0 border-b">
                <h2 className="text-xl font-medium truncate mr-4">{currentAccident.name}</h2>
                
                <div className="flex items-center justify-center gap-3 flex-grow">
                  <Button
                    onClick={handlePreviousAccident}
                    disabled={currentAccidentIndex === 0}
                    variant="ghost"
                    size="sm"
                  >
                    <FaChevronLeft className="mr-1 h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-gray-600 text-sm whitespace-nowrap">
                    Acidente {currentAccidentIndex + 1} de {accidents.length}
                  </span>
                  <Button
                    onClick={handleNextAccident}
                    disabled={currentAccidentIndex === accidents.length - 1}
                    variant="ghost"
                    size="sm"
                  >
                    Próximo <FaChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>

                {hasDeletePermission && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAccident(currentAccident._id!)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    <FaTrash />
                  </Button>
                )}
              </div>

              <div className="w-full flex-grow border rounded-lg shadow-md overflow-hidden">
                {currentAccident.pdfUrl ? (
                   <PDFViewer url={currentAccident.pdfUrl} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Documento PDF não disponível para este acidente.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
           <DialogContent>
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
      </div>
    </Layout>
  );
} 