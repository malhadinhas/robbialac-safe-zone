
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { PrivateRoute, PublicOnlyRoute } from "@/components/PrivateRoute";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Index";
import Formacoes from "./pages/Formacoes";
import Videos from "./pages/Videos";
import VideosVisualizar from "./pages/VideosVisualizar";
import QuaseAcidentes from "./pages/QuaseAcidentes";
import QuaseAcidentesEditar from "./pages/QuaseAcidentesEditar";
import QuaseAcidentesNovo from "./pages/QuaseAcidentesNovo";
import Pontuacao from "./pages/Pontuacao";
import Definicoes from "./pages/Definicoes";
import NotFound from "./pages/NotFound";

// Configure QueryClient with retry settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 10000,
      meta: {
        // Corrigido: removida a propriedade onError direta e movida para dentro de meta
        errorHandler: (error: unknown) => {
          console.error("Global query error:", error);
        }
      }
    },
  },
});

const App = () => {
  useEffect(() => {
    console.log("=== APP COMPONENT RENDERED ===");
    
    // Add a safety timeout to detect if app is stuck in loading
    const safetyTimeout = setTimeout(() => {
      console.log("SAFETY CHECK: App might be stuck in loading state");
      console.log("SAFETY CHECK: Current route:", window.location.pathname);
      console.log("SAFETY CHECK: Current URL:", window.location.href);
      
      // Log detailed React tree state
      console.log("SAFETY CHECK: Trying to identify where rendering might be stuck");
    }, 5000); // Reduced from 10 seconds to 5 seconds
    
    return () => {
      clearTimeout(safetyTimeout);
      console.log("App component cleanup");
    };
  }, []);

  console.log("App component rendering...");

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <DatabaseProvider>
            <AuthProvider>
              <div className="app-container">
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicOnlyRoute />}>
                    <Route path="/login" element={<Login />} />
                  </Route>
                  
                  {/* Private Routes */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/formacoes" element={<Formacoes />} />
                    <Route path="/videos/:zone" element={<Videos />} />
                    <Route path="/videos/visualizar/:id" element={<VideosVisualizar />} />
                    <Route path="/quase-acidentes" element={<QuaseAcidentes />} />
                    <Route path="/quase-acidentes/editar/:id" element={<QuaseAcidentesEditar />} />
                    <Route path="/quase-acidentes/novo" element={<QuaseAcidentesNovo />} />
                    <Route path="/pontuacao" element={<Pontuacao />} />
                    <Route path="/definicoes" element={<Definicoes />} />
                  </Route>
                  
                  {/* Error Route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </AuthProvider>
          </DatabaseProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
