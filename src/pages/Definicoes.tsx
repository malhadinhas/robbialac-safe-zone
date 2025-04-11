
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
import { initializeR2Config } from "@/config/storage";
import { initializeMongoConfig } from "@/config/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Definicoes() {
  const [language, setLanguage] = useState("pt");
  const [saved, setSaved] = useState(false);
  
  // Cloudflare R2 config
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("");
  const [r2PublicUrl, setR2PublicUrl] = useState("");
  
  // MongoDB config
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("robbialac_security");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };
  
  const handleSaveR2Config = () => {
    try {
      // Validações básicas
      if (!r2AccountId || !r2AccessKeyId || !r2SecretKey || !r2BucketName || !r2PublicUrl) {
        toast.error("Preencha todos os campos da configuração R2");
        return;
      }
      
      initializeR2Config({
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretKey,
        bucketName: r2BucketName,
        publicUrl: r2PublicUrl
      });
      
      toast.success("Configuração do Cloudflare R2 salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração R2:", error);
      toast.error("Erro ao salvar configuração R2");
    }
  };
  
  const handleSaveMongoConfig = () => {
    try {
      // Validação básica
      if (!mongoUri || !mongoDbName) {
        toast.error("Preencha todos os campos da configuração MongoDB");
        return;
      }
      
      initializeMongoConfig({
        uri: mongoUri,
        dbName: mongoDbName,
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      });
      
      toast.success("Configuração do MongoDB Atlas salva com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configuração MongoDB:", error);
      toast.error("Erro ao salvar configuração MongoDB");
    }
  };

  return (
    <Layout>
      <div className="container py-6 space-y-6">
        <h1 className="text-2xl font-bold">Definições</h1>
        
        <Tabs defaultValue="interface">
          <TabsList className="mb-6">
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="storage">Armazenamento</TabsTrigger>
            <TabsTrigger value="database">Base de Dados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="interface">
            <div className="grid gap-6 md:grid-cols-1">
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
          </TabsContent>
          
          <TabsContent value="whatsapp">
            <WhatsAppIntegration />
          </TabsContent>
          
          <TabsContent value="storage">
            <Card>
              <CardHeader>
                <CardTitle>Armazenamento de Vídeos</CardTitle>
                <CardDescription>
                  Configure a integração com Cloudflare R2 para armazenamento de vídeos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="r2-account-id">ID da Conta Cloudflare</Label>
                  <Input 
                    id="r2-account-id" 
                    value={r2AccountId}
                    onChange={(e) => setR2AccountId(e.target.value)}
                    placeholder="ex: 123456789abcdef" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="r2-access-key">Access Key ID</Label>
                  <Input 
                    id="r2-access-key" 
                    value={r2AccessKeyId}
                    onChange={(e) => setR2AccessKeyId(e.target.value)}
                    placeholder="ex: ABCDEFG123456789" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="r2-secret-key">Secret Access Key</Label>
                  <Input 
                    id="r2-secret-key" 
                    type="password"
                    value={r2SecretKey}
                    onChange={(e) => setR2SecretKey(e.target.value)}
                    placeholder="••••••••••••••••" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="r2-bucket">Nome do Bucket</Label>
                  <Input 
                    id="r2-bucket" 
                    value={r2BucketName}
                    onChange={(e) => setR2BucketName(e.target.value)}
                    placeholder="ex: robbialac-videos" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="r2-public-url">URL Pública do Bucket</Label>
                  <Input 
                    id="r2-public-url" 
                    value={r2PublicUrl}
                    onChange={(e) => setR2PublicUrl(e.target.value)}
                    placeholder="ex: https://videos.seu-dominio.com" 
                  />
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm mt-4">
                  <p>
                    <strong>Nota:</strong> Para integração com Cloudflare R2, você precisará:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Criar um bucket R2 no painel da Cloudflare</li>
                    <li>Configurar as R2 API Keys (Access e Secret keys)</li>
                    <li>Ativar o Workers Site ou o R2 Website</li>
                    <li>Configurar uma URL personalizada com um domínio próprio via DNS</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleSaveR2Config}
                  className="mt-4"
                >
                  Salvar Configuração R2
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="database">
            <Card>
              <CardHeader>
                <CardTitle>Banco de Dados MongoDB Atlas</CardTitle>
                <CardDescription>
                  Configure a conexão com MongoDB Atlas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mongo-uri">URI de Conexão MongoDB</Label>
                  <Input 
                    id="mongo-uri" 
                    value={mongoUri}
                    onChange={(e) => setMongoUri(e.target.value)}
                    placeholder="mongodb+srv://usuario:senha@cluster0.mongodb.net/" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mongo-db">Nome do Banco de Dados</Label>
                  <Input 
                    id="mongo-db" 
                    value={mongoDbName}
                    onChange={(e) => setMongoDbName(e.target.value)}
                    placeholder="robbialac_security" 
                  />
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-amber-800 text-sm mt-4">
                  <p>
                    <strong>Nota:</strong> Para integração com MongoDB Atlas, você precisará:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Criar uma conta no MongoDB Atlas</li>
                    <li>Configurar um cluster (o plano gratuito é suficiente para testes)</li>
                    <li>Configurar um usuário de banco de dados com as permissões necessárias</li>
                    <li>Configurar a Network Access para permitir conexões dos IPs necessários</li>
                    <li>Obter a string de conexão no formato MongoDB+SRV</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={handleSaveMongoConfig}
                  className="mt-4"
                >
                  Salvar Configuração MongoDB
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
