
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, X, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  useIsMobile, 
  useIsTablet, 
  useIsCompactView,
  useOrientation,
  useAdaptiveSpacing,
  useViewportHeight,
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
  const isCompactView = useIsCompactView();
  const orientation = useOrientation();
  const adaptiveSpacing = useAdaptiveSpacing();
  const viewportHeight = useViewportHeight();
  
  const [menuOpen, setMenuOpen] = useState(!isCompactView);
  
  useEffect(() => {
    setMenuOpen(!isCompactView);
  }, [isCompactView]);
  
  const toggleMenu = () => setMenuOpen(!menuOpen);
  
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
  
  useEffect(() => {
    if (isCompactView && menuOpen) {
      if (orientation === "landscape") {
        setMenuOpen(false);
      }
    }
  }, [orientation, isCompactView, menuOpen]);

  const mainHeight = viewportHeight 
    ? `${viewportHeight}px` 
    : "100vh";
  
  const expandedMenuWidth = "14rem";
  const collapsedMenuWidth = "3.5rem";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {isCompactView && (
        <header 
          className="bg-robbialac text-white p-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30"
          style={{ paddingLeft: adaptiveSpacing.md, paddingRight: adaptiveSpacing.md }}
        >
          <div className="flex items-center space-x-2 max-w-[75%]">
            <img 
              src="/lovable-uploads/a3de5e63-ebb5-4968-b16b-6769bce13858.png" 
              alt="RobbiSeg Logo" 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white shrink-0" 
            />
            <div className="flex items-center">
              <span className="font-bold text-sm sm:text-base">RobbiSeg</span>
            </div>
          </div>
        </header>
      )}
      
      <aside 
        className={cn(
          "bg-[#1E90FF] text-white transition-all duration-300 ease-in-out",
          isCompactView
            ? cn("fixed inset-0 z-50 transform", 
                menuOpen ? "translate-x-0" : "-translate-x-full",
                orientation === "landscape" ? "w-3/5 sm:w-1/2 md:w-2/5" : "w-full",
                "pt-16")
            : cn(`min-h-screen sticky top-0 shrink-0`,
                menuOpen ? `w-[${expandedMenuWidth}]` : `w-[${collapsedMenuWidth}]`,
                menuOpen ? "block" : "hidden lg:block", 
                "transition-[width]")
        )}
        style={{ 
          width: isCompactView ? undefined : menuOpen ? expandedMenuWidth : collapsedMenuWidth 
        }}
      >
        {!isCompactView && (
          <div className="p-3 border-b border-white/20">
            <div className={cn(
              "flex items-center", 
              menuOpen ? "space-x-3" : "justify-center"
            )}>
              <img 
                src="/lovable-uploads/6e68a784-6498-4199-a8ef-936b67038a4b.png" 
                alt="RobbiSeg Logo" 
                className="w-8 h-8 rounded-full bg-white" 
              />
              {menuOpen && (
                <div className="flex items-center justify-between w-full">
                  <h1 className="font-bold text-sm transition-opacity whitespace-normal">RobbiSeg</h1>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-7 w-7 text-white hover:bg-white/10"
                    onClick={toggleMenu}
                  >
                    <Menu size={16} />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className={cn(
          "border-b border-white/20",
          isCompactView || menuOpen ? "p-3" : "p-2 flex justify-center"
        )}>
          <div className={cn(
            "flex", 
            isCompactView || menuOpen 
              ? "flex-col items-center space-y-2"
              : "flex-col space-y-2 items-center"
          )}>
            <div className="bg-white text-robbialac rounded-full w-8 h-8 flex items-center justify-center font-bold shrink-0 text-sm">
              {user?.name.substring(0, 1)}
            </div>
            {(isCompactView || menuOpen) && (
              <div className="overflow-hidden text-center">
                <p className="font-medium text-xs sm:text-sm whitespace-normal break-words">{user?.name}</p>
                <p className="text-xs text-white/70 whitespace-normal break-words">{user?.email}</p>
              </div>
            )}
          </div>
        </div>
        
        <nav className={cn(
          "flex flex-col flex-1",
          isCompactView || menuOpen ? "p-2" : "items-center p-1"
        )}>
          <ul className={cn(
            isCompactView || menuOpen ? "space-y-1 w-full" : "space-y-3 w-full flex flex-col items-center"
          )}>
            {menuItems.map((item) => (
              <li key={item.path} className="w-full">
                <Link
                  to={item.path}
                  onClick={() => isCompactView && setMenuOpen(false)}
                  className={cn(
                    "flex items-center rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-white text-[#1E90FF] font-medium"
                      : "text-white hover:bg-white/10",
                    isCompactView || menuOpen 
                      ? "px-3 py-2 space-x-3" 
                      : "justify-center py-2 px-0 flex-col space-y-1"
                  )}
                  title={!menuOpen && !isCompactView ? item.label : undefined}
                >
                  <item.icon size={isCompactView ? 18 : menuOpen ? 18 : 16} />
                  {(isCompactView || menuOpen) ? (
                    <span className="text-xs sm:text-sm whitespace-normal">{item.label}</span>
                  ) : (
                    <span className="text-[10px] font-light hidden lg:block">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className={cn(
          "sticky bottom-0 pb-safe p-4",
          "flex flex-col space-y-2"
        )}>
          <Button 
            variant="ghost" 
            size="default"
            className="w-full text-white hover:bg-white/10 justify-start"
            onClick={toggleMenu}
          >
            <X className="mr-2 h-4 w-4" />
            <span className="text-sm">Fechar Menu</span>
          </Button>

          <Button 
            variant="ghost" 
            size="default"
            className="w-full text-white hover:bg-white/10 justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-sm">Sair</span>
          </Button>
        </div>
      </aside>
      
      {isCompactView && menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {!isCompactView && !menuOpen && (
        <div 
          className="fixed top-3 z-30 flex items-center"
          style={{
            left: menuOpen ? `calc(${expandedMenuWidth} - 0.75rem)` : `calc(${collapsedMenuWidth} - 0.75rem)`
          }}
        >
          <Button 
            variant="outline" 
            size="icon"
            className={cn(
              "bg-sky-50 border-sky-200 text-sky-600 hover:bg-sky-100 transition-all",
              menuOpen ? `left-[${expandedMenuWidth}]` : `left-[${collapsedMenuWidth}]`
            )}
            onClick={toggleMenu}
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>
        </div>
      )}
      
      <main 
        style={{ 
          minHeight: mainHeight,
          paddingTop: isCompactView ? "calc(60px + 1rem)" : "1rem",
          paddingLeft: "1.5rem",
          paddingRight: "1.5rem",
          paddingBottom: "1rem"
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
