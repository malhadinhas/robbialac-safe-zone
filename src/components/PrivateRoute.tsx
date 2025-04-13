
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Settings, Loader2 } from "lucide-react";
import { useEffect } from "react";

export const PrivateRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected, connectionError, reconnect, isInitializing } = useDatabase();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("PrivateRoute rendered with status:", { 
      isAuthenticated, 
      isLoading, 
      isConnected, 
      connectionError, 
      isInitializing 
    });
  }, [isAuthenticated, isLoading, isConnected, connectionError, isInitializing]);
  
  // Mostra tela de carregamento durante a inicialização
  if (isLoading || isInitializing) {
    console.log("PrivateRoute: Exibindo tela de carregamento");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 text-robbialac animate-spin mb-4" />
        <div className="text-robbialac text-xl font-semibold mb-2">
          Inicializando...
        </div>
        <p className="text-gray-500 text-center max-w-md mb-2">
          Conectando ao banco de dados e carregando a aplicação.
        </p>
        <p className="text-xs text-gray-400">
          {isLoading ? "Verificando autenticação..." : ""}
          {isInitializing ? "Inicializando banco de dados..." : ""}
        </p>
      </div>
    );
  }
  
  // Mostra erro de conexão se não conseguiu conectar ao banco de dados
  if (!isConnected && connectionError) {
    console.log("PrivateRoute: Exibindo erro de conexão");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md max-w-2xl w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-red-700">Erro de Conexão com Banco de Dados</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Não foi possível conectar ao banco de dados MongoDB. Por favor, verifique suas 
            configurações de conexão e tente novamente.
          </p>
          <p className="text-gray-700 mb-4 font-mono text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {connectionError}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => {
                console.log("PrivateRoute: Botão de reconexão clicado");
                reconnect();
              }}
              className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => {
                console.log("PrivateRoute: Navegando para definições");
                navigate("/definicoes");
              }}
              variant="outline" 
              className="flex items-center justify-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Definições
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Redireciona para login se não estiver autenticado
  if (!isAuthenticated) {
    console.log("PrivateRoute: Usuário não autenticado. Redirecionando para login...");
    return <Navigate to="/login" replace />;
  }
  
  // Se tudo estiver ok, mostra o conteúdo da rota
  console.log("PrivateRoute: Renderizando conteúdo protegido");
  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isConnected, connectionError, reconnect, isInitializing } = useDatabase();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("PublicOnlyRoute rendered with status:", { 
      isAuthenticated, 
      isLoading, 
      isConnected, 
      connectionError, 
      isInitializing 
    });
  }, [isAuthenticated, isLoading, isConnected, connectionError, isInitializing]);
  
  // Mostra tela de carregamento durante a inicialização
  if (isLoading || isInitializing) {
    console.log("PublicOnlyRoute: Exibindo tela de carregamento");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 text-robbialac animate-spin mb-4" />
        <div className="text-robbialac text-xl font-semibold mb-2">
          Inicializando...
        </div>
        <p className="text-gray-500 text-center max-w-md mb-2">
          Conectando ao banco de dados e carregando a aplicação.
        </p>
        <p className="text-xs text-gray-400">
          {isLoading ? "Verificando autenticação..." : ""}
          {isInitializing ? "Inicializando banco de dados..." : ""}
        </p>
      </div>
    );
  }
  
  // Mesmo nas rotas públicas, mostramos erro de conexão
  if (!isConnected && connectionError) {
    console.log("PublicOnlyRoute: Exibindo erro de conexão");
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-md max-w-2xl w-full">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            <h1 className="text-xl font-bold text-red-700">Erro de Conexão com Banco de Dados</h1>
          </div>
          <p className="text-gray-700 mb-4">
            Não foi possível conectar ao banco de dados MongoDB. Por favor, verifique suas 
            configurações de conexão e tente novamente.
          </p>
          <p className="text-gray-700 mb-4 font-mono text-sm bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {connectionError}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => {
                console.log("PublicOnlyRoute: Botão de reconexão clicado");
                reconnect();
              }}
              className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={() => {
                console.log("PublicOnlyRoute: Navegando para definições");
                navigate("/definicoes");
              }}
              variant="outline" 
              className="flex items-center justify-center"
            >
              <Settings className="mr-2 h-4 w-4" />
              Ir para Definições
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Redireciona para dashboard se já estiver autenticado
  if (isAuthenticated) {
    console.log("PublicOnlyRoute: Usuário já autenticado. Redirecionando para dashboard...");
    return <Navigate to="/" replace />;
  }
  
  // Se tudo estiver ok, mostra o conteúdo da rota
  console.log("PublicOnlyRoute: Renderizando conteúdo público");
  return <Outlet />;
};
