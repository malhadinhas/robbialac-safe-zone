import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createAccident, getAccidentById, updateAccident } from '@/services/accidentService';
import { getDepartments } from '@/services/departmentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AcidenteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    departmentId: '',
    document: null as File | null
  });

  // Buscar dados do acidente se estiver editando
  const { data: accident } = useQuery({
    queryKey: ['accident', id],
    queryFn: () => getAccidentById(id!),
    enabled: isEditing,
    onSuccess: (data) => {
      setFormData({
        title: data.title,
        description: data.description,
        date: new Date(data.date).toISOString().split('T')[0],
        departmentId: data.departmentId._id,
        document: null
      });
    }
  });

  // Buscar lista de departamentos
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (isEditing) {
        return updateAccident(id!, data);
      }
      return createAccident(data);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Documento atualizado com sucesso!' : 'Documento criado com sucesso!');
      navigate('/acidentes');
    },
    onError: () => {
      toast.error('Erro ao salvar documento.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const form = new FormData();
    form.append('title', formData.title);
    form.append('description', formData.description);
    form.append('date', formData.date);
    form.append('departmentId', formData.departmentId);
    
    if (formData.document) {
      form.append('document', formData.document);
    }

    mutation.mutate(form);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData(prev => ({ ...prev, document: file }));
    } else {
      toast.error('Por favor, selecione um arquivo PDF válido.');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEditing ? 'Editar Documento de Acidente' : 'Novo Documento de Acidente'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="departmentId">Departamento (Opcional)</Label>
            <select
              id="departmentId"
              value={formData.departmentId}
              onChange={e => setFormData(prev => ({ ...prev, departmentId: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Sem departamento</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="document">Documento PDF</Label>
            <Input
              id="document"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required={!isEditing}
            />
            {isEditing && !formData.document && (
              <p className="text-sm text-gray-500 mt-1">
                Deixe em branco para manter o documento atual
              </p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/acidentes')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
} 