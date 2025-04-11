
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useIsMobile, 
  useIsTablet, 
  useIsCompactView,
  useOrientation,
  useAdaptiveSpacing,
  useViewportHeight
} from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompactView = useIsCompactView();
  const orientation = useOrientation();
  const adaptiveSpacing = useAdaptiveSpacing();
  const viewportHeight = useViewportHeight();
  
  // Menu sempre fechado por padrão para mobile e tablet
  const [menuOpen, setMenuOpen] = useState(false); 
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
  // Menu items adaptativos - mais compactos em landscape
  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/" },
    { icon: BookOpen, label: "Formações", path: "/formacoes" },
    { icon: AlertTriangle, label: "Quase Acidentes", path: "/quase-acidentes" },
    { icon: Medal, label: "Pontuação", path: "/pontuacao" },
    { icon: Settings, label: "Definições", path: "/definicoes" }
  ];
  
  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };
  
  // Ajusta o layout quando a orientação muda
  useEffect(() => {
    if (isCompactView && menuOpen) {
      // Fechar menu em landscape para economizar espaço
      if (orientation === "landscape") {
        setMenuOpen(false);
      }
    }
  }, [orientation, isCompactView, menuOpen]);

  // Calcula a altura do conteúdo principal adaptável ao viewport
  const mainHeight = viewportHeight 
    ? `${viewportHeight}px` 
    : "100vh";
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Header para dispositivos compactos */}
      {isCompactView && (
        <header 
          className="bg-robbialac text-white p-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30"
          style={{ paddingLeft: adaptiveSpacing.md, paddingRight: adaptiveSpacing.md }}
        >
          <div className="flex items-center space-x-2 max-w-[75%]">
            <img src="/placeholder.svg" alt="Logo" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shrink-0" />
            {/* Substitui o texto por uma imagem em tela pequena */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/01973b68-ea11-48fd-b8e4-c72012f7cde3.png" 
                alt="RobbialacSegurança" 
                className="h-8 object-contain"
              />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="ultra-responsive" 
            iconOnly
            onClick={toggleMenu} 
            className="text-white"
          >
            {menuOpen ? <X size={isMobile ? 20 : 24} /> : <Menu size={isMobile ? 20 : 24} />}
          </Button>
        </header>
      )}
      
      {/* Sidebar adaptativa */}
      <aside 
        className={cn(
          "bg-robbialac text-white transition-all duration-300 ease-in-out",
          isCompactView
            ? cn("fixed inset-0 z-50 transform", 
                menuOpen ? "translate-x-0" : "-translate-x-full",
                orientation === "landscape" ? "w-3/5 sm:w-1/2 md:w-2/5" : "w-full",
                "pt-16") // Add padding top to avoid overlapping with header
            : cn("w-64 min-h-screen sticky top-0", 
                menuOpen ? "block" : "hidden lg:block lg:w-20 xl:w-64", 
                "transition-[width]")
        )}
      >
        {/* Logo para desktop */}
        {!isCompactView && (
          <div className="p-4 border-b border-white/20">
            <div className={cn(
              "flex items-center", 
              menuOpen ? "space-x-3" : "justify-center"
            )}>
              <img src="/placeholder.svg" alt="Logo" className="w-8 h-8 rounded-full bg-white" />
              {menuOpen && <h1 className="font-bold transition-opacity truncate">RobbialacSegurança</h1>}
            </div>
          </div>
        )}
        
        {/* User info com layout adaptativo */}
        <div className={cn(
          "border-b border-white/20",
          isCompactView || menuOpen ? "p-4" : "p-2 flex justify-center"
        )}>
          <div className={cn(
            "flex items-center", 
            isCompactView || menuOpen ? "space-x-3 w-full" : "flex-col space-y-2"
          )}>
            <div className="bg-white text-robbialac rounded-full w-10 h-10 flex items-center justify-center font-bold shrink-0">
              {user?.name.substring(0, 1)}
            </div>
            {(isCompactView || menuOpen) && (
              <div className="overflow-hidden max-w-[calc(100%-3rem)]">
                <p className="font-medium truncate text-sm sm:text-base">{user?.name}</p>
                <p className="text-xs text-white/70 truncate">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Navigation adaptativa - mostra apenas ícones em telas pequenas ou quando menu colapsado */}
        <nav className={cn(
          "flex flex-col",
          isCompactView || menuOpen ? "p-2" : "items-center p-2"
        )}>
          <ul className={cn(
            isCompactView || menuOpen ? "space-y-1 w-full" : "space-y-4 w-full flex flex-col items-center"
          )}>
            {menuItems.map((item) => (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => isCompactView && setMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-white text-robbialac font-medium"
                      : "text-white hover:bg-white/10",
                    isCompactView || menuOpen 
                      ? "px-3 py-2 space-x-3" 
                      : "justify-center py-2 px-0 flex-col space-y-1"
                  )}
                  title={!menuOpen && !isCompactView ? item.label : undefined}
                >
                  <item.icon size={isCompactView ? 20 : menuOpen ? 20 : 18} />
                  {(isCompactView || menuOpen) ? (
                    <span className="text-sm sm:text-base truncate">{item.label}</span>
                  ) : (
                    <span className="text-xs font-light hidden lg:block truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout com layout adaptativo */}
        <div className={cn(
          "mt-auto sticky bottom-0 pb-safe",
          isCompactView || menuOpen ? "p-2" : "p-2 flex justify-center"
        )}>
          <Button 
            variant="ghost" 
            size={isCompactView ? "responsive" : menuOpen ? "default" : "icon"}
            className={cn(
              "text-white hover:bg-white/10",
              isCompactView || menuOpen ? "w-full justify-start" : "aspect-square"
            )}
            onClick={logout}
            title={!menuOpen && !isCompactView ? "Sair" : undefined}
          >
            <LogOut className={cn(
              isCompactView || menuOpen ? "mr-3" : "",
              "h-5 w-5"
            )} />
            {(isCompactView || menuOpen) && "Sair"}
          </Button>
        </div>
      </aside>
      
      {/* Backdrop para menu em mobile e tablet quando aberto */}
      {isCompactView && menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {/* Botão toggle para desktop */}
      {!isCompactView && (
        <div className="fixed top-4 left-4 z-30">
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "bg-white shadow-md border-robbialac/20 transition-all",
              menuOpen ? "left-[17rem]" : "left-[4rem]"
            )}
            onClick={toggleMenu}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      )}
      
      {/* Main content com layout fluido e espaçamento adaptativo */}
      <main 
        style={{ 
          minHeight: mainHeight,
          paddingTop: isCompactView ? "calc(60px + " + adaptiveSpacing.md + ")" : adaptiveSpacing.lg,
          paddingLeft: !isCompactView ? (menuOpen ? "calc(16rem + " + adaptiveSpacing.md + ")" : "calc(5rem + " + adaptiveSpacing.md + ")") : adaptiveSpacing.md,
          paddingRight: isCompactView ? adaptiveSpacing.md : adaptiveSpacing.xl,
          paddingBottom: adaptiveSpacing.lg
        }}
        className={cn(
          "flex-1 transition-all w-full overflow-x-hidden",
          orientation === "landscape" && isCompactView && "pb-safe"
        )}
      >
        {children}
      </main>
    </div>
  );
}
