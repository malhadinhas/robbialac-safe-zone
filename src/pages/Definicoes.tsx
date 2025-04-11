
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { WhatsAppIntegration } from "@/components/whatsapp/WhatsAppIntegration";
import { useState } from "react";
import { Check } from "lucide-react";

export default function Definicoes() {
  const [language, setLanguage] = useState("pt");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">Definições</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <WhatsAppIntegration />
          
          <Card>
            <CardHeader>
              <CardTitle>Interface</CardTitle>
              <CardDescription>
                Personalize o comportamento da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select 
                  defaultValue={language} 
                  onValueChange={setLanguage}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português</SelectItem>
                    <SelectItem value="en">Inglês</SelectItem>
                    <SelectItem value="es">Espanhol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-notifications">Email para notificações</Label>
                <Input 
                  id="email-notifications" 
                  type="email" 
                  placeholder="seu-email@example.com" 
                />
              </div>
              
              <Button 
                onClick={handleSave}
                className="mt-4"
              >
                {saved ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Salvo
                  </>
                ) : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
