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
          className="bg-robbialac text-white p-3 flex items-center justify-between z-30 flex-shrink-0"
          style={{ paddingLeft: adaptiveSpacing.md, paddingRight: adaptiveSpacing.md }}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={toggleMenu}
          >
            <Menu size={24} />
            <span className="sr-only">Abrir menu</span>
          </Button>
          <div className="flex-1 flex items-center justify-center">
            <span className="font-bold text-lg">RobbiSeg</span>
          </div>
          <div className="w-10"></div> 
        </header>
      )}
      {/* Menu lateral fixo em desktop */}
      <aside
        className={cn(
          "transition-all duration-300 ease-in-out z-40",
          "hidden lg:flex fixed left-0 top-0 h-full w-[14rem] flex-col bg-[#1E90FF] text-white",
          isMobileOrTablet && menuOpen ? "fixed inset-0 flex flex-col bg-[#1E90FF] text-white w-[14rem] max-w-full h-full" : ""
        )}
        style={{
          width: '14rem',
          height: '100vh',
        }}
      >
        {/* Botão de fechar só em mobile/tablet */}
        {isMobileOrTablet && menuOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-50"
            onClick={() => setMenuOpen(false)}
          >
            <X size={24} />
            <span className="sr-only">Fechar menu</span>
          </Button>
        )}
        {/* Logotipo e User Info */}
        <div className="p-3 flex flex-col items-center">
          <img 
            src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" 
            alt="RobbiSeg Logo" 
            className="w-12 h-12 rounded-full bg-white mb-2" 
          />
          <div className="bg-white text-robbialac rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0 text-sm mb-1">
            {userInitial}
          </div>
          <div className="overflow-hidden text-center mb-2">
            <p className="font-medium text-xs sm:text-sm whitespace-normal">{userName}</p>
            <p className="text-xs text-white/70 whitespace-normal break-words">{userEmail}</p>
          </div>
          <Separator className="bg-white/20 my-2" />
        </div>
        {/* Navigation Menu */}
        <nav className="flex flex-col flex-1 overflow-y-auto p-2">
          <ul className="space-y-1 w-full">
            {menuItems.map((item) => (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => isMobileOrTablet && setMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-md transition-colors px-3 py-2 space-x-3",
                    isActive(item.path)
                      ? "bg-white text-[#1E90FF] font-medium"
                      : "text-white hover:bg-white/10"
                  )}
                  title={item.label}
                >
                  <item.icon size={18} />
                  <span className="text-xs sm:text-sm whitespace-normal">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {/* Logout Button */}
        <div className="sticky bottom-0 bg-[#1E90FF] pb-safe p-4 border-t border-white/20">
          <Button 
            variant="ghost" 
            size="default"
            className="w-full text-white hover:bg-white/10 justify-start"
            onClick={logout}
            title="Sair"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-sm">Sair</span>
          </Button>
        </div>
      </aside>
      {/* Overlay só em mobile/tablet e menu aberto */}
      {isMobileOrTablet && menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setMenuOpen(false)} />
      )}
      {/* Main content: margem à esquerda só em desktop */}
      <main className={isDesktop ? "flex-1 h-screen overflow-y-auto ml-[14rem]" : "flex-1 h-screen overflow-y-auto"}>
        {children}
      </main>
    </div>
  );
}
