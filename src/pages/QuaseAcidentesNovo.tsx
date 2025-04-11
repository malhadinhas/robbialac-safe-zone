
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createIncident, fileToBase64 } from "@/services/incidentService";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, Save } from "lucide-react";
import ImageUploader from "@/components/incidents/ImageUploader";
import { Incident } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface FormIncidentData {
  title: string;
  description: string;
  location: string;
  date: string;
  severity: "Baixo" | "Médio" | "Alto";
  status: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  department: string;
  reportedBy: string;
  reporterName: string;
  pointsAwarded: number;
  factoryArea?: string;
  suggestionToFix?: string;
  resolutionDeadline?: string;
}

const QuaseAcidentesNovo = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormIncidentData>({
    title: "",
    description: "",
    location: "",
    date: new Date().toISOString().split('T')[0],
    severity: "Médio",
    status: "Reportado",
    department: "",
    reportedBy: user?.id || "",
    reporterName: user?.name || "",
    pointsAwarded: 5,
    factoryArea: "",
    suggestionToFix: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImagesChange = (newImages: string[]) => {
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.severity || !formData.department) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const newIncident = {
        ...formData,
        date: new Date(formData.date),
        resolutionDeadline: formData.resolutionDeadline ? new Date(formData.resolutionDeadline) : undefined,
        images: images
      } as Omit<Incident, "id">;
      
      await createIncident(newIncident);
      toast.success("Quase acidente reportado com sucesso");
      navigate("/quase-acidentes");
    } catch (error) {
      console.error("Error creating incident:", error);
      toast.error("Erro ao reportar quase acidente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container p-4">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/quase-acidentes")}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Novo Quase Acidente</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações principais */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informações principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Título do quase acidente"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Descrição <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    rows={4}
                    required
                    placeholder="Descreva detalhadamente o que aconteceu"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium mb-1">
                      Local <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="Local onde ocorreu"
                    />
                  </div>
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium mb-1">
                      Data <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-1">
                      Departamento <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="Departamento responsável"
                    />
                  </div>
                  <div>
                    <label htmlFor="factoryArea" className="block text-sm font-medium mb-1">
                      Área da Fábrica
                    </label>
                    <Input
                      id="factoryArea"
                      name="factoryArea"
                      value={formData.factoryArea || ""}
                      onChange={handleInputChange}
                      placeholder="Área específica da fábrica"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="suggestionToFix" className="block text-sm font-medium mb-1">
                    Sugestão de Correção
                  </label>
                  <Textarea
                    id="suggestionToFix"
                    name="suggestionToFix"
                    value={formData.suggestionToFix || ""}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Sugestões para resolver o problema"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Status e Prioridade */}
            <Card>
              <CardHeader>
                <CardTitle>Status e Prioridade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium mb-1">
                    Gravidade <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => handleSelectChange("severity", value)}
                  >
                    <SelectTrigger id="severity">
                      <SelectValue placeholder="Selecione a gravidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixo">Baixo</SelectItem>
                      <SelectItem value="Médio">Médio</SelectItem>
                      <SelectItem value="Alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Imagens */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Imagens</CardTitle>
                <CardDescription>Adicione imagens que ajudem a entender o quase acidente</CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader 
                  onImagesSelected={() => {}} 
                  onImagesChange={handleImagesChange}
                />
                
                {images.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Imagens Adicionadas ({images.length})</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`Imagem ${index + 1}`} 
                            className="h-24 w-full object-cover rounded-md border border-gray-200"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                const updatedImages = images.filter((_, i) => i !== index);
                                setImages(updatedImages);
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="lg:col-span-3 flex justify-end gap-3 mt-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate("/quase-acidentes")}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-robbialac hover:bg-robbialac-dark"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Reportar Quase Acidente
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default QuaseAcidentesNovo;
