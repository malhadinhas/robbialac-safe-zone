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
import { getAllUsers, updateUserRole } from '@/services/userService';

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

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [errorUsers, setErrorUsers] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('interface');

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
      // Apenas simula o salvamento local
      toast.success("Configuração do MongoDB Atlas salva localmente (apenas visual). No frontend não há conexão direta!");
    } catch (error) {
      toast.error("Erro ao salvar configuração MongoDB: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    }
  };

  const isAdminApp = user?.role === 'admin_app';
  const hasIncidentPermission = user?.role === 'admin_app' || user?.role === 'admin_qa';

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setErrorUsers(null);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorUsers(err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await updateUserRole(id, role);
      toast.success('Role atualizado com sucesso!');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    if (isAdminApp) fetchUsers();
  }, [isAdminApp]);

  // Interface Card Component
  const InterfaceCard = () => (
    <Card className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all">
      <CardHeader className="p-6">
        <CardTitle className="text-xl font-bold text-gray-800">{t('interface')}</CardTitle>
        <CardDescription className="text-gray-500">{t('customize_app')}</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="language" className="text-sm font-medium text-gray-700">{t('language')}</Label>
          <Select value={i18n.language} onValueChange={changeLanguage}>
            <SelectTrigger id="language" className="rounded-lg">
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
          <Label htmlFor="email-notifications" className="text-sm font-medium text-gray-700">{t('notifications_email')}</Label>
          <Input 
            id="email-notifications" 
            type="email" 
            placeholder={t('email_placeholder')} 
            className="rounded-lg"
          />
        </div>
        
        <Button 
          onClick={handleSave} 
          className="bg-[#1E90FF] hover:bg-[#1877cc] text-white font-semibold rounded-full px-6 py-2 shadow-lg"
        >
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

  // Mobile/Tablet Layout - Usar Select para tabs
  const MobileLayout = () => (
    <div className="container py-4 h-full flex flex-col">
      <h1 className="text-xl font-bold mb-4 flex-shrink-0">{t('settings')}</h1>
      <div className="mb-4">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="interface">{t('interface')}</SelectItem>
            {isAdminApp && <SelectItem value="admin">Admin</SelectItem>}
            {isAdminApp && <SelectItem value="users">{t('users')}</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-grow overflow-y-auto">
        {activeTab === 'interface' && <InterfaceCard />}
        {isAdminApp && activeTab === 'admin' && (
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="whatsapp">
              <AccordionTrigger className="text-base font-semibold">WhatsApp</AccordionTrigger>
              <AccordionContent>
                <WhatsAppIntegration />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="medals">
              <AccordionTrigger className="text-base font-semibold">{t('medals')}</AccordionTrigger>
              <AccordionContent>
                <MedalManagement />
              </AccordionContent>
            </AccordionItem>
            {hasIncidentPermission && (
              <AccordionItem value="incidents">
                <AccordionTrigger className="text-base font-semibold">{t('near_misses')}</AccordionTrigger>
                <AccordionContent>
                  <IncidentTargetEditor />
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="analytics">
              <AccordionTrigger className="text-base font-semibold">{t('analytics')}</AccordionTrigger>
              <AccordionContent>
                <AnalyticsPage />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
        {isAdminApp && activeTab === 'users' && (
          <div className="mt-0 flex-grow overflow-y-auto">
            {loadingUsers ? (
              <p>A carregar utilizadores...</p>
            ) : errorUsers ? (
              <p className="text-red-500">{errorUsers}</p>
            ) : (
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Nome</th>
                    <th className="border px-2 py-1">Email</th>
                    <th className="border px-2 py-1">Role</th>
                    <th className="border px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="border px-2 py-1">{user.name}</td>
                      <td className="border px-2 py-1">{user.email}</td>
                      <td className="border px-2 py-1">{user.role}</td>
                      <td className="border px-2 py-1 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'admin_app')} disabled={user.role === 'admin_app'}>Admin App</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'admin_qa')} disabled={user.role === 'admin_qa'}>Admin QA</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'user')} disabled={user.role === 'user'}>Despromover</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
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

          {isAdminApp && <TabsTrigger value="users">{t('users')}</TabsTrigger>}
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

        {isAdminApp && (
          <TabsContent value="users" className="mt-0 flex-grow overflow-y-auto">
            {loadingUsers ? (
              <p>A carregar utilizadores...</p>
            ) : errorUsers ? (
              <p className="text-red-500">{errorUsers}</p>
            ) : (
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    <th className="border px-2 py-1">Nome</th>
                    <th className="border px-2 py-1">Email</th>
                    <th className="border px-2 py-1">Role</th>
                    <th className="border px-2 py-1">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>
                      <td className="border px-2 py-1">{user.name}</td>
                      <td className="border px-2 py-1">{user.email}</td>
                      <td className="border px-2 py-1">{user.role}</td>
                      <td className="border px-2 py-1 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'admin_app')} disabled={user.role === 'admin_app'}>Admin App</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'admin_qa')} disabled={user.role === 'admin_qa'}>Admin QA</Button>
                        <Button size="sm" variant="outline" onClick={() => handleRoleChange(user._id, 'user')} disabled={user.role === 'user'}>Despromover</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );

  return (
    <Layout>
      <div className="h-full bg-[#f7faff] p-3 sm:p-6 overflow-y-auto">
        {/* Renderização responsiva: Tabs para desktop e mobile */}
        {isCompactView ? <MobileLayout /> : <DesktopLayout />}
      </div>
    </Layout>
  );
}
