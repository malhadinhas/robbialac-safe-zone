import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { createAccident } from "@/services/accidentService";
import { Accident } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext"; // Para obter o ID do utilizador que reporta

// Definir o tipo para os dados do formulário, omitindo campos gerados automaticamente
type NewAccidentData = Omit<Accident, '_id' | 'id' | 'status' | 'createdAt' | 'updatedAt' | 'reportedBy' | 'reporterName'>;

const NovoAcidente = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth(); // Obter dados do utilizador logado
  const [formData, setFormData] = useState<Partial<NewAccidentData>>({
    // Valores iniciais podem ser definidos aqui, se necessário
    date: new Date().toISOString().split('T')[0], // Preencher data atual por defeito
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (newAccidentData: Partial<Accident>) => createAccident(newAccidentData),
    onSuccess: (createdAccident) => {
      toast.success(`Acidente "${createdAccident.title}" registado com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['accidents'] }); // Invalidar a query da lista de acidentes
      navigate("/acidentes"); // Navegar de volta para a lista
    },
    onError: (error) => {
      console.error("Erro ao criar acidente:", error);
      toast.error("Falha ao registar o acidente. Verifique os dados e tente novamente.");
      setIsSubmitting(false);
    },
    onSettled: () => {
      // Executado após sucesso ou erro
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error("Utilizador não autenticado.");
        return;
    }
    setIsSubmitting(true);

    const accidentPayload: Partial<Accident> = {
        ...formData,
        date: formData.date ? new Date(formData.date) : new Date(),
        resolutionDeadline: formData.resolutionDeadline ? new Date(formData.resolutionDeadline) : undefined,
        // Adicionar o ID e nome do utilizador que está a reportar
        reportedBy: user.id,
        reporterName: user.name,
        status: "Reportado", // Status inicial
    };

    createMutation.mutate(accidentPayload);
  };

  return (
    <Layout>
      <div className="container p-4 mx-auto">
        <Button variant="outline" onClick={() => navigate("/acidentes")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Acidentes
        </Button>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Registar Novo Acidente</CardTitle>
            <CardDescription>Preencha os detalhes do acidente e adicione o link para o documento PDF associado.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna 1: Campos Principais */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-1">Título <span className="text-red-500">*</span></label>
                    <Input id="title" name="title" value={formData.title || ""} onChange={handleInputChange} required placeholder="Ex: Queda de material no armazém" />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição Detalhada <span className="text-red-500">*</span></label>
                    <Textarea id="description" name="description" value={formData.description || ""} onChange={handleInputChange} rows={5} required placeholder="Descreva o que aconteceu, como, onde, etc."/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="location" className="block text-sm font-medium mb-1">Local da Ocorrência <span className="text-red-500">*</span></label>
                        <Input id="location" name="location" value={formData.location || ""} onChange={handleInputChange} required placeholder="Ex: Corredor C, Secção 2" />
                      </div>
                      <div>
                        <label htmlFor="date" className="block text-sm font-medium mb-1">Data da Ocorrência <span className="text-red-500">*</span></label>
                        <Input id="date" name="date" type="date" value={formData.date || ""} onChange={handleInputChange} required />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="department" className="block text-sm font-medium mb-1">Departamento Envolvido <span className="text-red-500">*</span></label>
                        <Input id="department" name="department" value={formData.department || ""} onChange={handleInputChange} required placeholder="Ex: Logística" />
                      </div>
                      <div>
                        <label htmlFor="factoryArea" className="block text-sm font-medium mb-1">Área da Fábrica (Opcional)</label>
                        <Input id="factoryArea" name="factoryArea" value={formData.factoryArea || ""} onChange={handleInputChange} placeholder="Ex: Produção Tinteiros"/>
                      </div>
                  </div>
                  <div>
                    <label htmlFor="pdfUrl" className="block text-sm font-medium mb-1">URL do Documento PDF (Opcional)</label>
                    <Input 
                      id="pdfUrl" 
                      name="pdfUrl" 
                      type="url" 
                      placeholder="Cole aqui o link do PDF (upload feito nas Definições)"
                      value={formData.pdfUrl || ""} 
                      onChange={handleInputChange} 
                    />
                  </div>
                </div>

                {/* Coluna 2: Detalhes Adicionais */}
                <div className="space-y-4">
                  <div>
                    <label htmlFor="responsible" className="block text-sm font-medium mb-1">Responsável pela Análise/Resolução (Opcional)</label>
                    <Input id="responsible" name="responsible" value={formData.responsible || ""} onChange={handleInputChange} placeholder="Nome do responsável" />
                  </div>
                  <div>
                    <label htmlFor="resolutionDeadline" className="block text-sm font-medium mb-1">Prazo Esperado para Resolução (Opcional)</label>
                    <Input id="resolutionDeadline" name="resolutionDeadline" type="date" value={formData.resolutionDeadline || ""} onChange={handleInputChange} />
                  </div>
                  <div>
                    <label htmlFor="implementedAction" className="block text-sm font-medium mb-1">Ação Implementada (se aplicável no registo)</label>
                    <Textarea id="implementedAction" name="implementedAction" value={formData.implementedAction || ""} onChange={handleInputChange} rows={3} placeholder="Descreva a ação tomada"/>
                  </div>
                  <div>
                    <label htmlFor="adminNotes" className="block text-sm font-medium mb-1">Notas Adicionais (Visível para Admins)</label>
                    <Textarea id="adminNotes" name="adminNotes" value={formData.adminNotes || ""} onChange={handleInputChange} rows={3} placeholder="Observações internas"/>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-3 border-t pt-6">
              <Button variant="outline" type="button" onClick={() => navigate("/acidentes")} disabled={isSubmitting}>Cancelar</Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || createMutation.isPending}
                className="bg-robbialac hover:bg-robbialac-dark"
              >
                {isSubmitting || createMutation.isPending ? (
                  <> {/* TODO: Adicionar spinner */} 
                    <span className="mr-2">Registando...</span>
                  </>
                ) : (
                  <> <Save className="h-4 w-4 mr-2" /> Registar Acidente </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default NovoAcidente; 