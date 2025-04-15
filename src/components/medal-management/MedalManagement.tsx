import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getMedals, createMedal, updateMedal, deleteMedal, Medal } from '@/services/medalService';
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Definindo tipos para o formulário
type MedalFormData = Omit<Medal, '_id' | 'created_at' | 'updated_at' | 'acquired' | 'dateEarned' | 'acquiredDate'>; // Omite campos gerados

const MedalManagement: React.FC = () => {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedalId, setEditingMedalId] = useState<string | null>(null);
  const [medalToDelete, setMedalToDelete] = useState<Medal | null>(null);
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

  const handleAddNew = () => {
    setEditingMedalId(null);
    setCurrentMedal({ id: '', name: '', description: '', imageSrc: '', triggerAction: 'incidentReported', triggerCategory: undefined, requiredCount: 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (medal: Medal) => {
    setEditingMedalId(medal.id);
    setCurrentMedal({ 
      id: medal.id, 
      name: medal.name, 
      description: medal.description, 
      imageSrc: medal.imageSrc, 
      triggerAction: medal.triggerAction, 
      triggerCategory: medal.triggerCategory, 
      requiredCount: medal.requiredCount 
    });
    setIsModalOpen(true);
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

     const dataToSend: Partial<MedalFormData> = {
        name: currentMedal.name, description: currentMedal.description, imageSrc: currentMedal.imageSrc,
        triggerAction: currentMedal.triggerAction, triggerCategory: currentMedal.triggerCategory,
        requiredCount: Number(currentMedal.requiredCount) || 1,
     };
     if (dataToSend.triggerAction !== 'videoWatched' && dataToSend.triggerAction !== 'trainingCompleted') {
        delete dataToSend.triggerCategory;
     }

    try {
      if (editingMedalId) {
        await updateMedal(editingMedalId, dataToSend);
        toast.success(`Medalha "${currentMedal.name}" atualizada com sucesso!`);
      } else {
        const slugId = currentMedal.id.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!slugId) { toast.error("ID inválido após normalização."); setIsSubmitting(false); return; }
        await createMedal({ ...dataToSend, id: slugId } as MedalFormData);
        toast.success(`Medalha "${currentMedal.name}" criada com sucesso!`);
      }
      setIsModalOpen(false);
      setEditingMedalId(null);
      fetchMedals();
    } catch (error: any) {
        toast.error(`Erro ao ${editingMedalId ? 'atualizar' : 'criar'} medalha: ${error?.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!medalToDelete) return;

    setIsSubmitting(true);
    try {
      await deleteMedal(medalToDelete.id);
      toast.success(`Medalha "${medalToDelete.name}" apagada com sucesso!`);
      setMedalToDelete(null);
      fetchMedals();
    } catch (error: any) {
      toast.error(`Erro ao apagar medalha: ${error?.response?.data?.message || error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
      setMedalToDelete(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de Medalhas</CardTitle>
          <CardDescription>Adicione, edite ou remova medalhas e seus critérios.</CardDescription>
        </div>
        <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Medalha
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando medalhas...</p>
        ) : medals.length === 0 ? (
          <p>Nenhuma medalha encontrada.</p>
        ) : (
          <div className="space-y-4">
            {medals.map((medal) => (
              <div key={medal._id || medal.id} className="flex items-center justify-between p-4 border rounded-md gap-4">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                   <img
                     src={medal.imageSrc || '/src/assets/placeholder.png'}
                     alt={medal.name}
                     className="w-12 h-12 object-contain bg-gray-100 rounded p-1 flex-shrink-0"
                     onError={(e) => { e.currentTarget.src = '/src/assets/placeholder.png'; }}
                   />
                   <div className="flex-1 min-w-0">
                     <h4 className="font-semibold truncate">{medal.name} <span className="text-xs text-gray-500">({medal.id})</span></h4>
                     <p className="text-sm text-gray-600 truncate">{medal.description}</p>
                     <p className="text-xs text-gray-500 mt-1 truncate">
                       Critério: {medal.requiredCount}x {medal.triggerAction} {medal.triggerCategory ? `(${medal.triggerCategory})` : ''}
                     </p>
                   </div>
                </div>
                 <div className="flex space-x-2 flex-shrink-0">
                   <Button variant="outline" size="icon" onClick={() => handleEdit(medal)}>
                       <Edit className="h-4 w-4" />
                   </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon" onClick={() => setMedalToDelete(medal)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      {medalToDelete && (
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja apagar a medalha "{medalToDelete.name}" (ID: {medalToDelete.id})?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setMedalToDelete(null)}>Cancelar</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
                              {isSubmitting ? "Apagando..." : "Apagar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      )}
                    </AlertDialog>
                 </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={(open) => {setIsModalOpen(open); if (!open) setEditingMedalId(null); }}>
           <DialogContent className="sm:max-w-[600px]">
               <DialogHeader>
                 <DialogTitle>{editingMedalId ? 'Editar Medalha' : 'Adicionar Nova Medalha'}</DialogTitle>
                 <DialogDescription>
                   {editingMedalId ? 'Modifique os detalhes e critérios da medalha.' : 'Preencha os detalhes da nova medalha e seus critérios de conquista.'}
                 </DialogDescription>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                   <Label htmlFor="id" className="text-right">ID (Slug)</Label>
                   <Input id="id" name="id" value={currentMedal.id} onChange={handleInputChange} className="col-span-3" placeholder="ex: vigilante-expert" required disabled={!!editingMedalId} />
                   </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Nome</Label>
                      <Input id="name" name="name" value={currentMedal.name} onChange={handleInputChange} className="col-span-3" required />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">Descrição</Label>
                      <Textarea id="description" name="description" value={currentMedal.description} onChange={handleInputChange} className="col-span-3" required />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="imageSrc" className="text-right">Caminho Imagem</Label>
                      <Input id="imageSrc" name="imageSrc" value={currentMedal.imageSrc} onChange={handleInputChange} className="col-span-3" placeholder="/src/assets/medals/..." required />
                  </div>
                   <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="triggerAction" className="text-right">Ação</Label>
                      <Select value={currentMedal.triggerAction} onValueChange={(value) => handleSelectChange('triggerAction', value)} name="triggerAction">
                      <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="incidentReported">Reportar Incidente</SelectItem>
                          <SelectItem value="videoWatched">Assistir Vídeo</SelectItem>
                          <SelectItem value="trainingCompleted">Completar Treino</SelectItem>
                      </SelectContent>
                      </Select>
                  </div>
                  {(currentMedal.triggerAction === 'videoWatched' || currentMedal.triggerAction === 'trainingCompleted') && (
                      <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="triggerCategory" className="text-right">Categoria</Label>
                      <Select value={currentMedal.triggerCategory || ''} onValueChange={(value) => handleSelectChange('triggerCategory', value)} name="triggerCategory">
                          <SelectTrigger className="col-span-3"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Segurança">Segurança</SelectItem>
                              <SelectItem value="Qualidade">Qualidade</SelectItem>
                              <SelectItem value="Procedimentos e Regras">Procedimentos e Regras</SelectItem>
                              <SelectItem value="Introdução">Introdução</SelectItem>
                          </SelectContent>
                      </Select>
                      </div>
                  )}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="requiredCount" className="text-right">Contagem</Label>
                      <Input id="requiredCount" name="requiredCount" type="number" min="1" value={currentMedal.requiredCount} onChange={handleNumericInputChange} className="col-span-3" required />
                  </div>
               <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="outline" onClick={() => setEditingMedalId(null)}>Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (editingMedalId ? 'Salvando...' : 'Criando...') : (editingMedalId ? 'Salvar Alterações' : 'Criar Medalha')}
                  </Button>
               </DialogFooter>
              </form>
           </DialogContent>
       </Dialog>
    </Card>
  );
};

export default MedalManagement; 