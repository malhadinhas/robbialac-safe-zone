import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { PrivateRoute, PublicOnlyRoute } from "@/components/PrivateRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { useEffect } from "react";
import { Acidentes } from '@/components/acidentes/Acidentes';
import { Sensibilizacao } from '@/components/sensibilizacao/Sensibilizacao';

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Index";
import Formacoes from "./pages/Formacoes";
import Videos from "./pages/Videos";
import VideosVisualizar from "./pages/VideosVisualizar";
import QuaseAcidentes from "./pages/QuaseAcidentes";
import QuaseAcidentesEditar from "./pages/QuaseAcidentesEditar";
import QuaseAcidentesNovo from "./pages/QuaseAcidentesNovo";
import QuaseAcidentesEstatisticas from "./pages/QuaseAcidentesEstatisticas";
import Pontuacao from "./pages/Pontuacao";
import Definicoes from "./pages/Definicoes";
import Ranking from "./pages/Ranking";
import NotFound from "./pages/NotFound";
import TestApi from './pages/TestApi';
import AcidenteForm from "./pages/AcidenteForm";
import FeedPage from "./pages/Feed";
import QuaseAcidentesVisualizar from "./pages/QuaseAcidentesVisualizar";
import PDFViewerPage from "./pages/PDFViewerPage";

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
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
                    <Route path="/feed" element={<FeedPage />} />
                    <Route path="/formacoes" element={<Formacoes />} />
                    <Route path="/videos/:zone" element={<Videos />} />
                    <Route path="/videos/visualizar/:id" element={<VideosVisualizar />} />
                    <Route path="/quase-acidentes" element={<QuaseAcidentes />} />
                    <Route path="/quase-acidentes/editar/:id" element={<QuaseAcidentesEditar />} />
                    <Route path="/quase-acidentes/novo" element={<QuaseAcidentesNovo />} />
                    <Route path="/quase-acidentes/estatisticas" element={<QuaseAcidentesEstatisticas />} />
                    <Route path="/quase-acidentes/visualizar/:id" element={<QuaseAcidentesVisualizar />} />
                    <Route path="/pontuacao" element={<Pontuacao />} />
                    <Route path="/definicoes" element={<Definicoes />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/acidentes" element={<Acidentes />} />
                    <Route path="/acidentes/:id" element={<Acidentes />} />
                    <Route path="/acidentes/novo" element={<AcidenteForm />} />
                    <Route path="/acidentes/:id/editar" element={<AcidenteForm />} />
                    <Route path="/acidentes/pdf/:id" element={<PDFViewerPage />} />
                    <Route path="/sensibilizacao" element={<Sensibilizacao />} />
                    <Route path="/sensibilizacao/:id" element={<Sensibilizacao />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route element={<AdminRoute />}>
                    {/* <Route path="/definicoes/analytics" element={<AnalyticsPage />} /> */}
                  </Route>
                  
                  {/* Error Route */}
                  <Route path="*" element={<NotFound />} />

                  {/* Test API Route */}
                  <Route path="/test-api" element={<TestApi />} />
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
