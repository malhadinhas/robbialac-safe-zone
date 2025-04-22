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
import { useState, useEffect } from "react";
import { Check, BarChartHorizontal } from "lucide-react";
import { initializeR2Config } from "@/config/storage";
import { initializeMongoConfig } from "@/config/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import MedalManagement from "@/components/medal-management/MedalManagement";
import DepartmentEmployeeEditor from '@/components/analytics/DepartmentEmployeeEditor';
import IncidentTargetEditor from '@/components/analytics/IncidentTargetEditor';
import { useAuth } from "@/contexts/AuthContext";
import { useIsCompactView } from "@/hooks/use-mobile";
import { Link } from "react-router-dom";
import AnalyticsPage from "./Settings/AnalyticsPage";
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Definicoes() {
  const { t, i18n } = useTranslation();
  const [saved, setSaved] = useState(false);
  const { user } = useAuth();
  const isCompactView = useIsCompactView();
  
  // Cloudflare R2 config
  const [r2AccountId, setR2AccountId] = useState("");
  const [r2AccessKeyId, setR2AccessKeyId] = useState("");
  const [r2SecretKey, setR2SecretKey] = useState("");
  const [r2BucketName, setR2BucketName] = useState("");
  const [r2PublicUrl, setR2PublicUrl] = useState("");
  
  // MongoDB config
  const [mongoUri, setMongoUri] = useState("");
  const [mongoDbName, setMongoDbName] = useState("workplace-safety");

  // Carregar valores iniciais das variáveis de ambiente
  useEffect(() => {
    // Cloudflare R2
    setR2AccountId(import.meta.env.VITE_CF_ACCOUNT_ID || "485c3c736434b646ff46725121de873c");
    setR2AccessKeyId(import.meta.env.VITE_CF_ACCESS_KEY_ID || "56f3925666837ff8ba99087b930e88cb");
    setR2SecretKey(import.meta.env.VITE_CF_SECRET_ACCESS_KEY || "");  // Por segurança não exibimos a chave
    setR2BucketName(import.meta.env.VITE_CF_BUCKET_NAME || "workplace-safety-videos");
    setR2PublicUrl(import.meta.env.VITE_CF_PUBLIC_URL || "https://485c3c736434b646ff46725121de873c.r2.cloudflarestorage.com");
    
    // MongoDB
    setMongoUri(import.meta.env.VITE_MONGODB_URI || "mongodb+srv://RobbialacSeguranca:[senha]@workplace-safety.j7o51.mongodb.net/workplace-safety");
    setMongoDbName(import.meta.env.VITE_MONGODB_DB_NAME || "workplace-safety");
  }, []);

  const handleSave = () => {
    setSaved(true);
    toast.success(t('saveSuccess'));
    setTimeout(() => {
      setSaved(false);
    }, 2000);
  };
  
  const handleSaveR2Config = () => {
    try {
      if (!r2AccountId || !r2AccessKeyId || !r2BucketName || !r2PublicUrl) {
        toast.error("Preencha todos os campos obrigatórios da configuração R2");
        return;
      }
      
      initializeR2Config({
        accountId: r2AccountId,
        accessKeyId: r2AccessKeyId,
        secretAccessKey: r2SecretKey || import.meta.env.VITE_CF_SECRET_ACCESS_KEY || "31352a5a4c56a50c5f05cd7cdcb1d010f6fd6a24f32c2b1560bc56a613c266cc",
        bucketName: r2BucketName,
        publicUrl: r2PublicUrl
      });
      
      toast.success("Configuração do Cloudflare R2 salva com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configuração R2");
    }
  };
  
  const handleSaveMongoConfig = async () => {
    try {
      if (!mongoUri || !mongoDbName) {
        toast.error("Preencha todos os campos da configuração MongoDB");
        return;
      }
      
      initializeMongoConfig({
        uri: mongoUri,
        dbName: mongoDbName
      });
      
      toast.success("Configuração do MongoDB Atlas salva com sucesso!");
      
    } catch (error) {
      toast.error("Erro ao salvar configuração MongoDB: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  const isAdminApp = user?.role === 'admin_app';
  const hasIncidentPermission = user?.role === 'admin_app' || user?.role === 'admin_qa';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Interface Card Component
  const InterfaceCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>{t('interface')}</CardTitle>
        <CardDescription>{t('customize_app')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="language">{t('language')}</Label>
          <Select value={i18n.language} onValueChange={changeLanguage}>
            <SelectTrigger id="language">
              <SelectValue placeholder={t('select_language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pt">{t('portuguese')}</SelectItem>
              <SelectItem value="en">{t('english')}</SelectItem>
              <SelectItem value="fr">{t('french')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email-notifications">{t('notifications_email')}</Label>
          <Input 
            id="email-notifications" 
            type="email" 
            placeholder={t('email_placeholder')} 
          />
        </div>
        
        <Button onClick={handleSave} className="mt-4">
          {saved ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t('saved')}
            </>
          ) : t('save_changes')}
        </Button>
      </CardContent>
    </Card>
  );

  // Storage Card Component
  const StorageCard = () => (
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
            placeholder="ex: 485c3c736434b646ff46725121de873c" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="r2-access-key">Access Key ID</Label>
          <Input 
            id="r2-access-key" 
            value={r2AccessKeyId}
            onChange={(e) => setR2AccessKeyId(e.target.value)}
            placeholder="ex: 56f3925666837ff8ba99087b930e88cb" 
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
            placeholder="ex: workplace-safety-videos" 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="r2-public-url">URL Pública do R2</Label>
          <Input 
            id="r2-public-url" 
            value={r2PublicUrl}
            onChange={(e) => setR2PublicUrl(e.target.value)}
            placeholder="ex: https://pub-xyz.r2.dev" 
          />
        </div>
        
        <Button onClick={handleSaveR2Config} className="mt-4">
          Salvar Configuração R2
        </Button>
      </CardContent>
    </Card>
  );

  // Database Card Component
  const DatabaseCard = () => (
    <Card>
      <CardHeader>
        <CardTitle>Banco de Dados</CardTitle>
        <CardDescription>
          Configure a conexão com MongoDB Atlas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mongo-uri">URI de Conexão</Label>
          <Input 
            id="mongo-uri" 
            value={mongoUri}
            onChange={(e) => setMongoUri(e.target.value)}
            placeholder="mongodb+srv://..." 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mongo-db">Nome do Banco</Label>
          <Input 
            id="mongo-db" 
            value={mongoDbName}
            onChange={(e) => setMongoDbName(e.target.value)}
            placeholder="workplace-safety" 
          />
        </div>
        
        <Button onClick={handleSaveMongoConfig} className="mt-4">
          Salvar Configuração MongoDB
        </Button>
      </CardContent>
    </Card>
  );

  // Mobile/Tablet Layout - Using Accordion for Admin section
  const MobileLayout = () => (
    <div className="container py-4 h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4 flex-shrink-0">{t('settings')}</h1>
      
      <Tabs defaultValue="interface" className="w-full flex-grow flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-2 mb-4 flex-shrink-0">
          <TabsTrigger value="interface">{t('interface')}</TabsTrigger>
          {/* Keep Admin tab trigger if user is admin */}
          {isAdminApp && <TabsTrigger value="admin">Admin</TabsTrigger>}
        </TabsList>

        {/* Interface Tab Content (remains the same) */}
        <TabsContent value="interface" className="mt-0 flex-grow overflow-y-auto">
          <InterfaceCard />
        </TabsContent>

        {/* Admin Tab Content - Using Accordion */}
        {isAdminApp && (
          <TabsContent value="admin" className="mt-0 flex-grow overflow-y-auto"> {/* Keep overflow here */}
            <Accordion type="single" collapsible className="w-full space-y-4"> {/* Added space-y */} 
              
              {/* Section for WhatsApp */}
              <AccordionItem value="whatsapp">
                <AccordionTrigger className="text-base font-semibold">WhatsApp</AccordionTrigger>
                <AccordionContent>
                  <WhatsAppIntegration />
                </AccordionContent>
              </AccordionItem>

              {/* Section for Storage */}
              <AccordionItem value="storage">
                <AccordionTrigger className="text-base font-semibold">Storage</AccordionTrigger>
                <AccordionContent>
                  <StorageCard />
                </AccordionContent>
              </AccordionItem>

              {/* Section for Database */}
              <AccordionItem value="database">
                <AccordionTrigger className="text-base font-semibold">Database</AccordionTrigger>
                <AccordionContent>
                   <DatabaseCard />
                </AccordionContent>
              </AccordionItem>

              {/* Section for Medals */}
              <AccordionItem value="medals">
                 <AccordionTrigger className="text-base font-semibold">{t('medals')}</AccordionTrigger>
                 <AccordionContent>
                    <MedalManagement />
                 </AccordionContent>
              </AccordionItem>

              {/* Section for Incidents */}
              {hasIncidentPermission && ( // Keep permission check
                <AccordionItem value="incidents">
                    <AccordionTrigger className="text-base font-semibold">{t('near_misses')}</AccordionTrigger>
                    <AccordionContent>
                       <IncidentTargetEditor />
                    </AccordionContent>
                </AccordionItem>
              )}

              {/* Section for Analytics */}
              <AccordionItem value="analytics">
                 <AccordionTrigger className="text-base font-semibold">{t('analytics')}</AccordionTrigger>
                 <AccordionContent>
                    <AnalyticsPage />
                 </AccordionContent>
              </AccordionItem>

            </Accordion>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  // Desktop Layout
  const DesktopLayout = () => (
    <div className="container py-6 space-y-6 h-full flex flex-col">
      <h1 className="text-2xl font-bold flex-shrink-0">{t('settings')}</h1>
      
      <Tabs defaultValue="interface" className="space-y-4 flex-grow flex flex-col min-h-0">
        <TabsList className={`grid w-full ${isAdminApp ? 'grid-cols-7' : hasIncidentPermission ? 'grid-cols-2' : 'grid-cols-1'} flex-shrink-0`}>
          <TabsTrigger value="interface">{t('interface')}</TabsTrigger>
          
          {isAdminApp && (
            <>
              <TabsTrigger value="whatsapp">{t('whatsapp')}</TabsTrigger>
              <TabsTrigger value="storage">{t('storage')}</TabsTrigger>
              <TabsTrigger value="database">{t('database')}</TabsTrigger>
              <TabsTrigger value="medals">{t('medals')}</TabsTrigger>
            </>
          )}
          
          {hasIncidentPermission && (
            <TabsTrigger value="incidents">{t('near_misses')}</TabsTrigger>
          )}
          
          {isAdminApp && (
            <TabsTrigger value="analytics">
              <BarChartHorizontal className="mr-2 h-4 w-4" />{t('analytics')}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="interface" className="mt-0 flex-grow overflow-y-auto">
          <div className="grid gap-6 md:grid-cols-1">
            <InterfaceCard />
          </div>
        </TabsContent>
        
        {isAdminApp && (
          <>
            <TabsContent value="whatsapp" className="mt-0 flex-grow overflow-y-auto">
              <WhatsAppIntegration />
            </TabsContent>
            
            <TabsContent value="storage" className="mt-0 flex-grow overflow-y-auto">
              <StorageCard />
            </TabsContent>
            
            <TabsContent value="database" className="mt-0 flex-grow overflow-y-auto">
              <DatabaseCard />
            </TabsContent>
            
            <TabsContent value="medals" className="mt-0 flex-grow overflow-y-auto">
              <MedalManagement />
            </TabsContent>
          </>
        )}
        
        {hasIncidentPermission && (
          <TabsContent value="incidents" className="mt-0 flex-grow overflow-y-auto">
            <IncidentTargetEditor />
          </TabsContent>
        )}
        
        {isAdminApp && (
          <TabsContent value="analytics" className="mt-0 flex-grow overflow-y-auto">
            <AnalyticsPage />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  return (
    <Layout>
      <div className="h-full">
        {isCompactView ? <MobileLayout /> : <DesktopLayout />}
      </div>
    </Layout>
  );
}
