import React, { useState, useEffect } from 'react';
import { Accident } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { FaPlus, FaFilePdf, FaTrash } from 'react-icons/fa';
import { getAccidents, createAccident, deleteAccident } from '../services/accidentService';
import { Layout } from '@/components/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

const COUNTRIES = [
  { value: 'Portugal', label: 'Portugal' },
  { value: 'Itália', label: 'Itália' },
  { value: 'Espanha', label: 'Espanha' },
  { value: 'França', label: 'França' },
] as const;

type Country = typeof COUNTRIES[number]['value'];

const Acidentes: React.FC = () => {
  const router = useRouter();
  const [accidents, setAccidents] = useState<Accident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newAccident, setNewAccident] = useState<Partial<Accident>>({
    name: '',
    country: 'Portugal', // Valor padrão
    date: new Date(),
  });

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
      if (!selectedFile) {
        toast.error('Por favor, selecione um arquivo PDF');
        return;
      }

      const formData = new FormData();
      formData.append('name', newAccident.name || '');
      formData.append('country', newAccident.country || '');
      formData.append('date', newAccident.date?.toISOString() || new Date().toISOString());
      formData.append('document', selectedFile);

      await createAccident(formData);
      setShowAddModal(false);
      setNewAccident({
        name: '',
        country: 'Portugal',
        date: new Date(),
      });
      setSelectedFile(null);
      loadAccidents();
    } catch (error) {
      toast.error('Erro ao adicionar acidente');
    }
  };

  const handleDeleteAccident = async (id: string) => {
    try {
      await deleteAccident(id);
      toast.success('Acidente removido com sucesso');
      loadAccidents();
    } catch (error) {
      toast.error('Erro ao remover acidente');
    }
  };

  const handleViewPDF = (accident: Accident) => {
    router.push(`/pdf-viewer/${accident._id}?url=${encodeURIComponent(accident.pdfUrl)}&title=${encodeURIComponent(accident.name)}`);
  };

  const content = (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Acidentes</h1>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <FaPlus className="mr-2" /> Adicionar Acidente
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accidents.map((accident) => (
            <div key={accident._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{accident.name}</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteAccident(accident._id!)}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </Button>
              </div>
              <p className="text-gray-600 mb-2">País: {accident.country}</p>
              <p className="text-gray-600 mb-4">
                Data: {format(new Date(accident.date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center gap-2 text-blue-500 hover:text-blue-700"
                onClick={() => handleViewPDF(accident)}
              >
                <FaFilePdf /> Visualizar PDF
              </Button>
            </div>
          ))}
        </div>
      )}

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
              <Button
                onClick={handleAddAccident}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return <Layout>{content}</Layout>;
};

export default Acidentes; 