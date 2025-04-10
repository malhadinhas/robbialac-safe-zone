
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Definicoes() {
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [whatsappNotifications, setWhatsappNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  
  const handleSaveProfile = () => {
    toast.success("Perfil atualizado com sucesso!");
  };
  
  const handleSaveNotifications = () => {
    toast.success("Preferências de notificações atualizadas!");
  };
  
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Senha alterada com sucesso!");
  };
  
  const handleDeleteAccount = () => {
    setIsDialogOpen(true);
  };
  
  const confirmDeleteAccount = () => {
    toast.success("Conta excluída com sucesso!");
    logout();
  };
  
  const isAdmin = user?.role === 'admin_app' || user?.role === 'admin_qa';

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Definições</h1>
        <p className="text-gray-600">Gerencie sua conta e preferências</p>
      </div>
      
      <Tabs defaultValue="account">
        <TabsList className="mb-6" variant={isMobile ? "fitted" : "default"}>
          <TabsTrigger value="account" fullWidth={isMobile}>Conta</TabsTrigger>
          <TabsTrigger value="notifications" fullWidth={isMobile}>Notificações</TabsTrigger>
          <TabsTrigger value="security" fullWidth={isMobile}>Segurança</TabsTrigger>
          {isAdmin && <TabsTrigger value="admin" fullWidth={isMobile}>Administração</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" defaultValue={user?.name} />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue={user?.email} disabled />
                <p className="text-sm text-gray-500">O email não pode ser alterado</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" defaultValue="Produção" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input id="position" defaultValue="Operador" />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-robbialac hover:bg-robbialac-dark" onClick={handleSaveProfile}>
                Salvar Alterações
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Preferências de Interface</CardTitle>
              <CardDescription>
                Personalize sua experiência na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language">Idioma da Plataforma</Label>
                  <p className="text-sm text-gray-500">Selecione o idioma da interface</p>
                </div>
                <select className="border rounded p-2">
                  <option>Português</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Animações</Label>
                  <p className="text-sm text-gray-500">Ativar animações na interface</p>
                </div>
                <Switch defaultChecked />
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Layout Compacto</Label>
                  <p className="text-sm text-gray-500">Reduzir espaçamentos na interface</p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-robbialac hover:bg-robbialac-dark">
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificação</CardTitle>
              <CardDescription>
                Configure como deseja receber alertas e notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-lg mb-4">Canais de Comunicação</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email</Label>
                      <p className="text-sm text-gray-500">Receber notificações por email</p>
                    </div>
                    <Switch 
                      checked={emailNotifications} 
                      onCheckedChange={setEmailNotifications} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WhatsApp</Label>
                      <p className="text-sm text-gray-500">Receber notificações no WhatsApp</p>
                    </div>
                    <Switch 
                      checked={whatsappNotifications} 
                      onCheckedChange={setWhatsappNotifications}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                    </div>
                    <Switch 
                      checked={pushNotifications} 
                      onCheckedChange={setPushNotifications}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium text-lg mb-4">Tipos de Notificações</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Novos Vídeos</Label>
                      <p className="text-sm text-gray-500">Quando novos vídeos de formação forem adicionados</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Quase Acidentes</Label>
                      <p className="text-sm text-gray-500">Atualizações sobre quase acidentes reportados</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Pontos e Medalhas</Label>
                      <p className="text-sm text-gray-500">Quando ganhar pontos ou medalhas novas</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes</Label>
                      <p className="text-sm text-gray-500">Lembretes periódicos para completar formações</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="bg-robbialac hover:bg-robbialac-dark"
                onClick={handleSaveNotifications}
              >
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleChangePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <Input id="current-password" type="password" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input id="new-password" type="password" required />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input id="confirm-password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="bg-robbialac hover:bg-robbialac-dark">
                    Alterar Senha
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Segurança da Conta</CardTitle>
                <CardDescription>
                  Gerencie as configurações de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verificação em Duas Etapas</Label>
                    <p className="text-sm text-gray-500">Aumentar a segurança da sua conta</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    Ver Histórico de Login
                  </Button>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <h3 className="text-lg font-medium text-red-600 mb-2">Zona de Perigo</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    As seguintes ações são permanentes e não podem ser desfeitas.
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteAccount}
                  >
                    Excluir Minha Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {isAdmin && (
          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Administrador</CardTitle>
                <CardDescription>
                  Gerencie configurações avançadas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Configurações do Sistema</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="mongodb-uri">MongoDB URI</Label>
                        <Input id="mongodb-uri" placeholder="mongodb+srv://..." />
                      </div>
                      <div>
                        <Label htmlFor="whatsapp-number">Número do WhatsApp</Label>
                        <Input id="whatsapp-number" defaultValue="+351964244294" />
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Cloudflare R2 Storage</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="r2-account-id">R2 Account ID</Label>
                          <Input id="r2-account-id" placeholder="Seu R2 Account ID" />
                        </div>
                        <div>
                          <Label htmlFor="r2-access-key">R2 Access Key ID</Label>
                          <Input id="r2-access-key" placeholder="Seu R2 Access Key" />
                        </div>
                        <div>
                          <Label htmlFor="r2-secret-key">R2 Secret Access Key</Label>
                          <Input id="r2-secret-key" type="password" placeholder="Seu R2 Secret Key" />
                        </div>
                        <div>
                          <Label htmlFor="r2-bucket">R2 Bucket Name</Label>
                          <Input id="r2-bucket" placeholder="Nome do bucket" />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="r2-public-url">R2 Public URL</Label>
                          <Input id="r2-public-url" placeholder="URL pública do R2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-lg mb-4">Gerenciamento de Usuários</h3>
                  <Button className="bg-robbialac hover:bg-robbialac-dark">
                    Gerenciar Usuários
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-lg mb-4">Sistema de Gamificação</h3>
                  <Button className="bg-robbialac hover:bg-robbialac-dark mr-2">
                    Configurar Pontuação
                  </Button>
                  <Button variant="outline">
                    Gerenciar Medalhas
                  </Button>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium text-lg mb-4">Backup e Restauração</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline">
                      Exportar Dados
                    </Button>
                    <Button variant="outline">
                      Importar Dados
                    </Button>
                    <Button variant="outline" className="text-yellow-600">
                      Redefinir Sistema
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="bg-robbialac hover:bg-robbialac-dark">
                  Salvar Configurações
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente excluídos
              de nossos servidores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={confirmDeleteAccount}
            >
              Sim, excluir minha conta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
