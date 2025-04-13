
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected, connectionError, checkConnection } = useDatabase();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-robbialac text-xl font-semibold">
          Carregando...
        </div>
      </div>
    );
  }
  
  if (!isConnected && connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md max-w-2xl">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-red-700">Erro de Conexão com Banco de Dados</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Não foi possível conectar ao banco de dados MongoDB. Por favor, verifique suas 
            configurações de conexão e tente novamente.
          </p>
          <p className="text-gray-700 mb-4 font-mono text-sm bg-gray-100 p-2 rounded">
            {connectionError}
          </p>
          <div className="flex justify-between">
            <Button 
              onClick={() => checkConnection()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => window.location.href = "/definicoes"}
              variant="outline" 
            >
              Ir para Definições
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected, connectionError, checkConnection } = useDatabase();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-robbialac text-xl font-semibold">
          Carregando...
        </div>
      </div>
    );
  }
  
  // Mesmo nas rotas públicas, mostramos erro de conexão
  if (!isConnected && connectionError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md max-w-2xl">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-red-700">Erro de Conexão com Banco de Dados</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Não foi possível conectar ao banco de dados MongoDB. Por favor, verifique suas 
            configurações de conexão e tente novamente.
          </p>
          <p className="text-gray-700 mb-4 font-mono text-sm bg-gray-100 p-2 rounded">
            {connectionError}
          </p>
          <Button 
            onClick={() => checkConnection()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <Outlet />;
};
