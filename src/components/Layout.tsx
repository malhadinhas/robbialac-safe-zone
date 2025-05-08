import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, X, Menu, BarChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useIsMobile, useIsTablet, useOrientation, useAdaptiveSpacing } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isMobileOrTablet = isMobile || isTablet;
  const isDesktop = !isMobileOrTablet;
  const orientation = useOrientation();
  const adaptiveSpacing = useAdaptiveSpacing();
  
  // Estado do menu: só relevante em mobile/tablet
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Fecha o menu ao mudar para desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) setMenuOpen(false);
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleMenu = () => {
    if (isMobileOrTablet) setMenuOpen(prev => !prev);
  };
  
  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: BookOpen, label: "Formações", path: "/formacoes" },
    { icon: AlertTriangle, label: "Quase Acidentes", path: "/quase-acidentes" },
    { icon: FileText, label: "Acidentes", path: "/acidentes" },
    { icon: BookOpen, label: "Sensibilização", path: "/sensibilizacao" },
    { icon: BarChart, label: "Estatísticas", path: "/quase-acidentes/estatisticas" },
    { icon: Medal, label: "Pontuação", path: "/pontuacao" },
    { icon: Settings, label: "Definições", path: "/definicoes" }
  ];
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };
  
  // User info
  const userInitial = user?.name ? user.name.substring(0, 1).toUpperCase() : '?';
  const userName = user?.name || 'Utilizador';
  const userEmail = user?.email || '';

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header só para mobile/tablet */}
      {isMobileOrTablet && (
        <header 
          className="bg-white text-[#1E90FF] p-3 flex items-center justify-between z-30 flex-shrink-0 shadow-md rounded-b-2xl"
          style={{ paddingLeft: adaptiveSpacing.md, paddingRight: adaptiveSpacing.md }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="text-[#1E90FF] hover:bg-[#eaf4ff]"
            onClick={toggleMenu}
          >
            <Menu size={24} />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-bold text-lg">LearnSafe360</span>
          </div>
          <div className="w-10"></div> 
        </header>
      )}
      {/* Menu lateral fixo em desktop */}
      <aside 
        className={cn(
          "transition-all duration-300 ease-in-out z-40",
          "hidden lg:flex fixed left-0 top-0 h-full w-[16rem] flex-col bg-white text-[#222] shadow-lg rounded-2xl m-4",
          isMobileOrTablet && menuOpen ? "fixed inset-0 flex flex-col bg-white text-[#222] w-[16rem] max-w-full h-full shadow-lg rounded-2xl" : ""
        )}
        style={{ 
          width: '16rem',
          height: 'calc(100vh - 2rem)',
        }}
      >
        {/* Botão de fechar só em mobile/tablet */}
        {isMobileOrTablet && menuOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-[#1E90FF] hover:bg-[#eaf4ff] z-50"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} />
            <span className="sr-only">Fechar menu</span>
          </Button>
        )}
        {/* Logotipo */}
        <div className="p-6 pb-2 flex flex-col items-center">
              <img 
                src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" 
                alt="RobbiSeg Logo" 
            className="w-10 h-10 rounded-full bg-white mb-2 shadow" 
          />
          <span className="font-bold text-xl text-[#1E90FF]">LearnSafe360</span>
        </div>
        <Separator className="bg-gray-100 my-2" />
        {/* Navigation Menu */}
        <nav className="flex flex-col flex-1 overflow-y-auto p-2">
          <ul className="space-y-1 w-full">
            {menuItems.map((item) => (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => isMobileOrTablet && setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-full transition-all px-4 py-2 my-1 group",
                    isActive(item.path)
                      ? "bg-[#eaf4ff] text-[#1E90FF] font-semibold shadow-sm"
                      : "text-[#222] hover:bg-[#eaf4ff] hover:text-[#1E90FF]"
                  )}
                  title={item.label}
                >
                  <span className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-full transition-all",
                    isActive(item.path)
                      ? "bg-[#1E90FF]/10 text-[#1E90FF]"
                      : "bg-gray-100 group-hover:bg-[#1E90FF]/10 group-hover:text-[#1E90FF] text-[#222]"
                  )}>
                    <item.icon size={20} />
                  </span>
                  <span className="text-base whitespace-normal font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Botão Sair */}
        <div className="sticky bottom-0 bg-transparent pb-10 flex justify-center items-center p-6">
          <Button 
            variant="default" 
            size="lg"
            className="w-4/5 rounded-full bg-[#1E90FF] hover:bg-[#1877cc] text-white font-bold shadow-lg text-base py-3 flex items-center justify-center gap-2"
            onClick={logout}
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base">Sair</span>
          </Button>
        </div>
      </aside>
      {/* Overlay só em mobile/tablet e menu aberto */}
      {isMobileOrTablet && menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setMenuOpen(false)} />
      )}
      {/* Main content: margem à esquerda só em desktop */}
      <main className={isDesktop ? "flex-1 h-screen overflow-y-auto ml-[18rem]" : "flex-1 h-screen overflow-y-auto"}>
        {children}
      </main>
    </div>
  );
}
