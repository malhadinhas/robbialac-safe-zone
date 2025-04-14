import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { getMedals, createMedal, Medal } from '@/services/medalService'; // Assumindo que Medal tem a nova estrutura
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Definindo tipos para o formulário
type MedalFormData = Omit<Medal, '_id' | 'created_at' | 'updated_at'>; // Omite campos gerados

const MedalManagement: React.FC = () => {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMedal, setCurrentMedal] = useState<Partial<MedalFormData>>({
    id: '',
    name: '',
    description: '',
    imageSrc: '',
    triggerAction: 'incidentReported', // Valor padrão
    triggerCategory: undefined,
    requiredCount: 1
  });

  const fetchMedals = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getMedals();
      setMedals(data);
    } catch (error) {
      toast.error("Erro ao buscar medalhas.");
      console.error("Erro ao buscar medalhas:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedals();
  }, [fetchMedals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentMedal(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof MedalFormData, value: string) => {
    setCurrentMedal(prev => ({
      ...prev,
      [name]: value,
      // Resetar categoria se a ação não for video ou treino
      ...(name === 'triggerAction' && value !== 'videoWatched' && value !== 'trainingCompleted' && { triggerCategory: undefined })
    }));
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentMedal(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
  };

  const resetForm = () => {
    setCurrentMedal({
      id: '',
      name: '',
      description: '',
      imageSrc: '',
      triggerAction: 'incidentReported',
      triggerCategory: undefined,
      requiredCount: 1
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validação básica
    if (!currentMedal.id || !currentMedal.name || !currentMedal.description || !currentMedal.imageSrc || !currentMedal.triggerAction || !currentMedal.requiredCount) {
        toast.error("Por favor, preencha todos os campos obrigatórios.");
        setIsSubmitting(false);
        return;
    }
     if (currentMedal.requiredCount <= 0) {
         toast.error("Contagem necessária deve ser maior que zero.");
         setIsSubmitting(false);
         return;
     }
     if ((currentMedal.triggerAction === 'videoWatched' || currentMedal.triggerAction === 'trainingCompleted') && !currentMedal.triggerCategory) {
         toast.error("Categoria é obrigatória para ações de vídeo ou treino.");
         setIsSubmitting(false);
         return;
     }

     // Normalizar o ID para formato slug
     const slugId = currentMedal.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    try {
        // Criar a nova medalha
        await createMedal({
            ...currentMedal,
            id: slugId, // Usa o ID normalizado
            requiredCount: Number(currentMedal.requiredCount), // Garante que é número
        } as MedalFormData); // Força o tipo correto

        toast.success(`Medalha "${currentMedal.name}" criada com sucesso!`);
        setIsModalOpen(false);
        resetForm();
        fetchMedals(); // Recarrega a lista
    } catch (error: any) {
        console.error("Erro ao criar medalha:", error);
        toast.error(`Erro ao criar medalha: ${error?.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de Medalhas</CardTitle>
          <CardDescription>Adicione, edite ou remova medalhas e seus critérios.</CardDescription>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Medalha
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Medalha</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da nova medalha e seus critérios de conquista.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="id" className="text-right">ID (Slug)</Label>
                <Input
                  id="id"
                  name="id"
                  value={currentMedal.id}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="ex: vigilante-expert (será normalizado)"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentMedal.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Nome visível da medalha"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={currentMedal.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Descrição detalhada da medalha"
                  required
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageSrc" className="text-right">Caminho Imagem</Label>
                <Input
                  id="imageSrc"
                  name="imageSrc"
                  value={currentMedal.imageSrc}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="/src/assets/medals/nome-imagem.png"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="triggerAction" className="text-right">Ação Desencadeadora</Label>
                 <Select
                    value={currentMedal.triggerAction}
                    onValueChange={(value) => handleSelectChange('triggerAction', value)}
                    name="triggerAction"
                 >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="incidentReported">Reportar Incidente</SelectItem>
                    <SelectItem value="videoWatched">Assistir Vídeo</SelectItem>
                    <SelectItem value="trainingCompleted">Completar Treino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo Categoria Condicional */}
              {(currentMedal.triggerAction === 'videoWatched' || currentMedal.triggerAction === 'trainingCompleted') && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="triggerCategory" className="text-right">Categoria (Vídeo/Treino)</Label>
                    <Select
                        value={currentMedal.triggerCategory || ''}
                        onValueChange={(value) => handleSelectChange('triggerCategory', value)}
                        name="triggerCategory"
                    >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Idealmente, buscar categorias dinamicamente, mas por agora, fixas */}
                        <SelectItem value="Segurança">Segurança</SelectItem>
                        <SelectItem value="Qualidade">Qualidade</SelectItem>
                        <SelectItem value="Procedimentos e Regras">Procedimentos e Regras</SelectItem>
                        <SelectItem value="Introdução">Introdução</SelectItem>
                         {/* Adicionar outras categorias se necessário */}
                    </SelectContent>
                    </Select>
                </div>
              )}

               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="requiredCount" className="text-right">Contagem Necessária</Label>
                <Input
                  id="requiredCount"
                  name="requiredCount"
                  type="number"
                  min="1"
                  value={currentMedal.requiredCount}
                  onChange={handleNumericInputChange}
                  className="col-span-3"
                  required
                />
              </div>

            <DialogFooter>
               <DialogClose asChild>
                 <Button type="button" variant="outline">Cancelar</Button>
               </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Criando..." : "Criar Medalha"}
              </Button>
            </DialogFooter>
           </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando medalhas...</p>
        ) : medals.length === 0 ? (
          <p>Nenhuma medalha encontrada.</p>
        ) : (
          <div className="space-y-4">
            {medals.map((medal) => (
              <div key={medal._id || medal.id} className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center space-x-4">
                   <img src={medal.imageSrc} alt={medal.name} className="w-12 h-12 object-contain bg-gray-100 rounded p-1" />
                   <div>
                     <h4 className="font-semibold">{medal.name} <span className="text-xs text-gray-500">({medal.id})</span></h4>
                     <p className="text-sm text-gray-600">{medal.description}</p>
                     <p className="text-xs text-gray-500 mt-1">
                       Critério: {medal.requiredCount}x {medal.triggerAction} {medal.triggerCategory ? `(${medal.triggerCategory})` : ''}
                     </p>
                   </div>
                </div>
                 <div className="flex space-x-2">
                   {/* Botões de Editar e Apagar (funcionalidade a implementar) */}
                   <Button variant="outline" size="icon" disabled> <Edit className="h-4 w-4" /> </Button>
                   <Button variant="destructive" size="icon" disabled> <Trash2 className="h-4 w-4" /> </Button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MedalManagement; 