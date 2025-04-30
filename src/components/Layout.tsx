import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, X, Menu, BarChart, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  useIsMobile, 
  useIsTablet, 
  useIsCompactView,
  useOrientation,
  useAdaptiveSpacing,
  useViewportHeight,
  useShouldCollapseMenu,
  TABLET_BREAKPOINT
} from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const shouldCollapseMenu = useShouldCollapseMenu();
  const orientation = useOrientation();
  const adaptiveSpacing = useAdaptiveSpacing();
  const viewportHeight = useViewportHeight();
  
  const [menuOpen, setMenuOpen] = useState(!shouldCollapseMenu);
  
  useEffect(() => {
    setMenuOpen(!shouldCollapseMenu);
  }, [shouldCollapseMenu]);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
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
  
  useEffect(() => {
    if (shouldCollapseMenu && menuOpen) {
      if (orientation === "landscape") {
        setMenuOpen(false);
      }
    }
  }, [orientation, shouldCollapseMenu, menuOpen]);

  const mainHeight = viewportHeight 
    ? `${viewportHeight}px` 
    : "100vh";
  
  const expandedMenuWidth = "14rem";
  const collapsedMenuWidth = "3.5rem";

  // Obter a primeira letra do nome ou '?' se não disponível
  const userInitial = user?.name ? user.name.substring(0, 1).toUpperCase() : '?';
  const userName = user?.name || 'Utilizador'; // Nome a exibir ou 'Utilizador'
  const userEmail = user?.email || ''; // Email a exibir ou vazio

  return (
    <div className={`h-screen w-full flex flex-col md:flex-row ${isMobile ? '' : 'overflow-hidden'}`}>
      {shouldCollapseMenu && (
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
      
      <aside 
        className={cn(
          "bg-[#1E90FF] text-white transition-all duration-300 ease-in-out",
          isMobile
            ? cn("fixed inset-0 z-50 transform", 
                menuOpen ? "translate-x-0" : "-translate-x-full",
                orientation === "landscape" ? "w-3/5 sm:w-1/2 md:w-2/5" : "w-full",
                "pt-16") 
            : cn("h-screen sticky top-0 shrink-0",
                menuOpen ? `w-[${expandedMenuWidth}]` : `w-[${collapsedMenuWidth}]`,
                menuOpen ? "block" : "hidden lg:block", 
                "transition-[width]")
        )}
        style={{ 
          width: isMobile ? undefined : menuOpen ? expandedMenuWidth : collapsedMenuWidth,
          height: isMobile ? '100%' : '100vh'
        }}
      >
        {/* Botão de fechar para mobile */}
        {isMobile && menuOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 z-50"
            onClick={toggleMenu}
          >
            <X size={24} />
            <span className="sr-only">Fechar menu</span>
          </Button>
        )}

        {/* Conteúdo da Sidebar (Logotipo, User Info, Menu Items) */}
        {!isMobile && (
          <div className="p-3">
            <div className={cn(
              "flex items-center", 
              menuOpen ? "justify-between" : "justify-center"
            )}>
              <img 
                src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" 
                alt="RobbiSeg Logo" 
                className="w-12 h-12 rounded-full bg-white" 
              />
              {menuOpen && (
                <div className="flex-1 ml-4">
                  <h1 className="font-bold text-xl transition-opacity whitespace-normal">RobbiSeg</h1>
                </div>
              )}
            </div>
            
            <div className="my-2">
              <Separator className="bg-white/20" />
            </div>
            
            {!isTablet && (
              <div className="flex justify-center">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-7 w-7 text-white hover:bg-white/10"
                  onClick={toggleMenu}
                >
                  {menuOpen ? <X size={16} /> : <Menu size={16} />}
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* User Info */}
        <div className={cn(
          "border-b border-white/20",
          isMobile ? "pt-4 pb-3 px-3" : menuOpen ? "p-3" : "p-2 flex justify-center"
        )}>
          <div className={cn(
            "flex", 
            isMobile || menuOpen 
              ? "flex-col items-center space-y-2"
              : "flex-col space-y-2 items-center"
          )}>
            <div className="bg-white text-robbialac rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0 text-sm">
              {userInitial}
            </div>
            {(isMobile || menuOpen) && (
              <div className="overflow-hidden text-center">
                <p className="font-medium text-xs sm:text-sm whitespace-normal">{userName}</p>
                <p className="text-xs text-white/70 whitespace-normal break-words">{userEmail}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className={cn(
          "flex flex-col flex-1 overflow-y-auto",
          isMobile ? "p-2" : menuOpen ? "p-2" : "items-center p-1"
        )}>
          <ul className={cn(
            isMobile || menuOpen ? "space-y-1 w-full" : "space-y-3 w-full flex flex-col items-center"
          )}>
            {menuItems.map((item) => (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => isMobile && setMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-white text-[#1E90FF] font-medium"
                      : "text-white hover:bg-white/10",
                    isMobile || menuOpen 
                      ? "px-3 py-2 space-x-3" 
                      : "justify-center py-2 px-0 flex-col space-y-1"
                  )}
                  title={!menuOpen && !isMobile ? item.label : undefined}
                >
                  <item.icon size={isMobile ? 18 : menuOpen ? 18 : 16} />
                  {(isMobile || menuOpen) ? (
                    <span className="text-xs sm:text-sm whitespace-normal">{item.label}</span>
                  ) : (
                    <span className="text-[10px] font-light hidden lg:block">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout Button */}
        <div className={cn(
          "sticky bottom-0 bg-[#1E90FF] pb-safe", // Garante que não sobreponha a barra de navegação do iOS
          isMobile ? "p-4 border-t border-white/20" : menuOpen ? "p-4" : "p-2 flex justify-center"
        )}>
          <Button 
            variant="ghost" 
            size="default"
            className={cn(
              "w-full text-white hover:bg-white/10",
              isMobile || menuOpen ? "justify-start" : "justify-center p-0 h-auto"
            )}
            onClick={logout}
            title={!menuOpen && !isMobile ? "Sair" : undefined}
          >
            <LogOut className={cn(isMobile || menuOpen ? "mr-2" : "", "h-4 w-4")} />
            {(isMobile || menuOpen) && (
              <span className="text-sm">Sair</span>
            )}
          </Button>
        </div>
      </aside>
      
      {shouldCollapseMenu && menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      <main className={`flex-1 ${isMobile ? 'overflow-y-auto' : 'h-screen overflow-hidden'}`}>
        {children}
      </main>
    </div>
  );
}
