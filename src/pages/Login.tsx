import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Por favor, preencha todos os campos.");
      return;
    }
    
    if (!email.endsWith("@robbialac.pt")) {
      setError("Apenas emails @robbialac.pt são permitidos.");
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      setError((err as Error).message || "Erro ao fazer login. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <img 
              src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" 
              alt="RobbiSeg Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">RobbiSeg</h1>
          <p className="mt-2 text-gray-600">Plataforma de segurança e qualidade no trabalho</p>
        </div>
        
        <Card className="shadow-lg border-t-4 border-t-robbialac">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar no Sistema</CardTitle>
            <CardDescription>
              Faça login com seu email corporativo @robbialac.pt
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.nome@robbialac.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-robbialac hover:bg-robbialac-dark" 
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        <div className="text-center text-sm text-gray-500">
          <p>Demo: user@robbialac.pt / Sara2010</p>
          <p className="mt-1">Apenas para teste, substitua com sua conta real.</p>
        </div>
      </div>
    </div>
  );
}
