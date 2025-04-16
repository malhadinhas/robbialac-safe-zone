'use client';

import React, { useState, useEffect } from 'react';
import { Sensibilizacao } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFilePdf, FaTrash } from 'react-icons/fa';
import { getSensibilizacoes, createSensibilizacao, deleteSensibilizacao } from '@/services/sensibilizacaoService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { PDFPreview } from '@/components/PDFPreview';
import { NoScrollLayout } from '@/components/NoScrollLayout';

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

export function Sensibilizacao() {
  const navigate = useNavigate();
  const [sensibilizacoes, setSensibilizacoes] = useState<Sensibilizacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newSensibilizacao, setNewSensibilizacao] = useState<Partial<Sensibilizacao>>({
    name: '',
    country: 'Portugal',
    date: new Date(),
  });

  useEffect(() => {
    loadSensibilizacoes();
  }, []);

  const loadSensibilizacoes = async () => {
    try {
      const sensibilizacoesList = await getSensibilizacoes();
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
      loadSensibilizacoes();
    } catch (error) {
      toast.error('Erro ao remover documento');
    }
  };

  const handleViewPDF = (sensibilizacao: Sensibilizacao) => {
    const searchParams = new URLSearchParams({
      url: sensibilizacao.pdfUrl!,
      title: sensibilizacao.name
    });
    navigate(`/pdf-viewer/${sensibilizacao._id}?${searchParams.toString()}`);
  };

  return (
    <Layout>
      <NoScrollLayout>
        <div className="h-full">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Sensibilização</h1>
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-robbialac hover:bg-robbialac-dark text-white"
            >
              <FaPlus className="mr-2" /> Adicionar Documento
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-[calc(100%-4rem)]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-robbialac"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensibilizacoes.map((sensibilizacao) => (
                <div key={sensibilizacao._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h2 className="text-lg font-medium">{sensibilizacao.name}</h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSensibilizacao(sensibilizacao._id!)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">País: {sensibilizacao.country}</p>
                    <p className="text-gray-600 text-sm mb-3">
                      Data: {format(new Date(sensibilizacao.date), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>

                  <div className="px-4 pb-4">
                    <PDFPreview url={sensibilizacao.pdfUrl!} className="mb-3" />
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-center gap-2 text-robbialac hover:text-robbialac-dark"
                      onClick={() => handleViewPDF(sensibilizacao)}
                    >
                      <FaFilePdf /> Visualizar PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
      </NoScrollLayout>
    </Layout>
  );
} 