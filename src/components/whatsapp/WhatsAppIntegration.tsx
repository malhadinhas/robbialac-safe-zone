
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";

const WHATSAPP_NUMBER = "+351964244294";

export function WhatsAppIntegration() {
  const [enabled, setEnabled] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  
  const handleToggleIntegration = (checked: boolean) => {
    setEnabled(checked);
    if (checked) {
      toast.success("Integração com WhatsApp ativada! Os usuários podem enviar mensagens para " + WHATSAPP_NUMBER);
    } else {
      toast.info("Integração com WhatsApp desativada");
    }
    
    // Aqui seria feita a chamada para a API para ativar/desativar a integração
    // Implementação depende do backend
  };
  
  const handleTestIntegration = async () => {
    setIsTestLoading(true);
    try {
      // Simular uma chamada de API para testar a integração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulação bem-sucedida
      setTestSuccess(true);
      toast.success("Teste de conexão bem-sucedido!");
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (error) {
      toast.error("Erro ao testar a integração com WhatsApp");
    } finally {
      setIsTestLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integração com WhatsApp Business</CardTitle>
        <CardDescription>
          Configure a integração com o WhatsApp para permitir reportes de quase acidentes via mensagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="whatsapp-toggle" className="font-medium">
              Ativar integração com WhatsApp
            </Label>
            <p className="text-sm text-muted-foreground">
              Permite que usuários reportem quase acidentes enviando mensagem para o número configurado
            </p>
          </div>
          <Switch
            id="whatsapp-toggle"
            checked={enabled}
            onCheckedChange={handleToggleIntegration}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="whatsapp-number">Número do WhatsApp Business</Label>
          <Input 
            id="whatsapp-number"
            value={WHATSAPP_NUMBER}
            readOnly
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Este é o número que os usuários devem contatar para reportar quase acidentes
          </p>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleTestIntegration} 
            disabled={isTestLoading || !enabled}
          >
            {isTestLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : testSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Conexão testada
              </>
            ) : (
              "Testar conexão"
            )}
          </Button>
          {enabled && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2">Instruções para usuários:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Adicione o número {WHATSAPP_NUMBER} aos contatos</li>
                <li>Envie "Olá" ou "Quase acidente" para iniciar o reporte</li>
                <li>Siga as instruções do chatbot para completar o reporte</li>
              </ol>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
