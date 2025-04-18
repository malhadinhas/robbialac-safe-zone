import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PrivateRoute } from "./PrivateRoute"; // Reutiliza a lógica de PrivateRoute

/**
 * Componente para proteger rotas que exigem a role 'admin_app'.
 * Reutiliza a lógica de PrivateRoute para verificar autenticação e conexão com BD,
 * e adiciona a verificação de role.
 */
export const AdminRoute = () => {
  const { user, isLoading } = useAuth();

  // Renderiza o PrivateRoute que já trata loading, erros de conexão e autenticação
  return (
    <PrivateRoute>
      {/* Se PrivateRoute passou, verifica a role */}
      {() => {
        // Se ainda estiver carregando o usuário, aguarda (embora PrivateRoute já deva tratar isso)
        if (isLoading) {
          return <div>Verificando permissões...</div>; // Ou um Skeleton/Spinner
        }

        // Se o usuário não for admin_app, redireciona para a página inicial ou não autorizado
        if (user?.role !== 'admin_app') {
          // Pode redirecionar para uma página específica de "Não Autorizado" ou para a home
          return <Navigate to="/" replace />;
        }

        // Se for admin_app, renderiza o conteúdo da rota
        return <Outlet />;
      }}
    </PrivateRoute>
  );
};

// Versão alternativa onde AdminRoute faz toda a verificação (sem reutilizar PrivateRoute)
// import { Navigate, Outlet, useNavigate } from "react-router-dom";
// import { useAuth } from "@/contexts/AuthContext";
// import { useDatabase } from "@/contexts/DatabaseContext";
// import { Button } from "@/components/ui/button";
// import { AlertTriangle, RefreshCcw, Settings, Loader2 } from "lucide-react";

// export const AdminRoute = () => {
//   const { user, isAuthenticated, isLoading } = useAuth();
//   const { isConnected, connectionError, reconnect, isInitializing } = useDatabase();
//   const navigate = useNavigate();

//   if (isLoading || isInitializing) {
//     return (
//       <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
//         <Loader2 className="h-8 w-8 text-robbialac animate-spin mb-4" />
//         <p>Carregando...</p>
//       </div>
//     );
//   }

//   if (!isConnected && connectionError) {
//      // ... (código de erro de conexão igual ao PrivateRoute) ...
//      return <div>Erro de conexão</div>; 
//   }

//   if (!isAuthenticated) {
//     return <Navigate to="/login" replace />;
//   }

//   // Verifica a role específica
//   if (user?.role !== 'admin_app') {
//     return <Navigate to="/" replace />; // Ou para uma página de "Não Autorizado"
//   }

//   return <Outlet />;
// }; 