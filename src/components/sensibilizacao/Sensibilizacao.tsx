'use client';

import React, { useState, useEffect } from 'react';
import { Sensibilizacao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFilePdf, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getSensibilizacoes, createSensibilizacao, deleteSensibilizacao } from '@/services/sensibilizacaoService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PDFViewer } from '@/components/PDFViewer';
import { NoScrollLayout } from '@/components/NoScrollLayout';

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

export function Sensibilizacao() {
  const [sensibilizacoes, setSensibilizacoes] = useState<Sensibilizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newSensibilizacao, setNewSensibilizacao] = useState<Partial<Sensibilizacao>>({
    name: '',
    country: 'Portugal',
    date: new Date(),
  });
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState(0);

  useEffect(() => {
    loadSensibilizacoes();
  }, []);

  const loadSensibilizacoes = async () => {
    setLoading(true);
    try {
      const sensibilizacoesList = await getSensibilizacoes();
      setSensibilizacoes(sensibilizacoesList);
      setCurrentDocumentIndex(prevIndex => 
        sensibilizacoesList.length > 0 ? Math.min(prevIndex, sensibilizacoesList.length - 1) : 0
      );
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
      if (!selectedFile) {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }

      const formData = new FormData();
      formData.append('name', newSensibilizacao.name || '');
      formData.append('country', newSensibilizacao.country || '');
      formData.append('date', newSensibilizacao.date?.toISOString() || new Date().toISOString());
      formData.append('document', selectedFile);

      await createSensibilizacao(formData);
      setShowAddModal(false);
      setNewSensibilizacao({
        name: '',
        country: 'Portugal',
        date: new Date(),
      });
      setSelectedFile(null);
      loadSensibilizacoes();
      toast.success('Documento de sensibilização adicionado com sucesso');
    } catch (error) {
      toast.error('Erro ao adicionar documento de sensibilização');
    }
  };

  const handleDeleteSensibilizacao = async (id: string) => {
    try {
      await deleteSensibilizacao(id);
      toast.success('Documento removido com sucesso');
      setCurrentDocumentIndex(0);
      loadSensibilizacoes();
    } catch (error) {
      toast.error('Erro ao remover documento');
    }
  };

  const handlePreviousDocument = () => {
    setCurrentDocumentIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  const handleNextDocument = () => {
    setCurrentDocumentIndex(prevIndex => Math.min(sensibilizacoes.length - 1, prevIndex + 1));
  };

  const currentDocument = sensibilizacoes.length > 0 ? sensibilizacoes[currentDocumentIndex] : null;

  return (
    <Layout>
      {/* <NoScrollLayout> */}
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-2 p-2 border-b flex-shrink-0">
            <h1 className="text-xl font-semibold">Sensibilização</h1>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-robbialac hover:bg-robbialac-dark text-white"
              size="sm"
            >
              <FaPlus className="mr-1" /> Adicionar Documento
            </Button>
          </div>

          <div className="flex-grow overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
              </div>
            ) : !currentDocument ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Nenhum documento de sensibilização encontrado.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="w-full mb-2 p-2 flex justify-between items-center flex-shrink-0 border-b">
                  <h2 className="text-xl font-medium truncate mr-4">{currentDocument.name}</h2>
                  
                  <div className="flex items-center justify-center gap-3 flex-grow">
                    <Button
                      onClick={handlePreviousDocument}
                      disabled={currentDocumentIndex === 0}
                      variant="ghost"
                      size="sm"
                    >
                      <FaChevronLeft className="mr-1 h-4 w-4" /> Anterior
                    </Button>
                    <span className="text-gray-600 text-sm whitespace-nowrap">
                      Documento {currentDocumentIndex + 1} de {sensibilizacoes.length}
                    </span>
                    <Button
                      onClick={handleNextDocument}
                      disabled={currentDocumentIndex === sensibilizacoes.length - 1}
                      variant="ghost"
                      size="sm"
                    >
                      Próximo <FaChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSensibilizacao(currentDocument._id!)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    <FaTrash />
                  </Button>
                </div>

                <div className="w-full flex-grow border rounded-lg shadow-md overflow-hidden">
                  {currentDocument.pdfUrl ? (
                     <PDFViewer url={currentDocument.pdfUrl} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      URL do PDF não disponível.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="sm:max-w-md">
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
      {/* </NoScrollLayout> */}
    </Layout>
  );
} 