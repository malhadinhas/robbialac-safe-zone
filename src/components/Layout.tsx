
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isCompactView = isMobile || isTablet; // Simplifique a lógica para dispositivos compactos
  const [menuOpen, setMenuOpen] = useState(false); // Sempre fechado por padrão para mobile e tablet
  
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
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Header para mobile e tablet */}
      {isCompactView && (
        <header className="bg-robbialac text-white p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center space-x-2">
            <img src="/placeholder.svg" alt="Logo" className="w-8 h-8 rounded-full bg-white" />
            <h1 className="font-bold">RobbialacSegurança</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </header>
      )}
      
      {/* Sidebar para desktop / Menu para mobile e tablet */}
      <aside 
        className={cn(
          "bg-robbialac text-white",
          isCompactView
            ? cn("fixed inset-0 z-50 transition-transform transform", 
                menuOpen ? "translate-x-0" : "-translate-x-full",
                "pt-16") // Add padding top to avoid overlapping with header
            : cn("w-64 min-h-screen sticky top-0", menuOpen ? "block" : "hidden")
        )}
      >
        {/* Logo para desktop */}
        {!isCompactView && (
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center space-x-2">
              <img src="/placeholder.svg" alt="Logo" className="w-8 h-8 rounded-full bg-white" />
              <h1 className="font-bold">RobbialacSegurança</h1>
            </div>
          </div>
        )}
        
        {/* User info */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <div className="bg-white text-robbialac rounded-full w-10 h-10 flex items-center justify-center font-bold">
              {user?.name.substring(0, 1)}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-xs text-white/70 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => isCompactView && setMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                    isActive(item.path)
                      ? "bg-white text-robbialac font-medium"
                      : "text-white hover:bg-white/10"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Logout */}
        <div className="p-2 mt-auto sticky bottom-0">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={logout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
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
              "bg-white shadow-md border-robbialac/20",
              menuOpen ? "left-[17rem]" : "left-4"
            )}
            onClick={toggleMenu}
          >
            <Menu size={18} />
          </Button>
        </div>
      )}
      
      {/* Main content */}
      <main className={cn(
        "flex-1 transition-all",
        isCompactView && "pt-20 p-4",
        !isCompactView && (menuOpen ? "ml-64" : "ml-0 px-16"),
        !isCompactView && "p-6"
      )}>
        {children}
      </main>
    </div>
  );
}
