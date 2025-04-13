
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { PrivateRoute, PublicOnlyRoute } from "@/components/PrivateRoute";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DatabaseProvider>
          <AuthProvider>
            <Routes>
              {/* Rotas Públicas */}
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<Login />} />
              </Route>
              
              {/* Rotas Privadas */}
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
              
              {/* Rota de Erro */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </DatabaseProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
