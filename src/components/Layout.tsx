
import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Home, BookOpen, AlertTriangle, Medal, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);
  
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
      {/* Mobile header */}
      {isMobile && (
        <header className="bg-robbialac text-white p-4 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center space-x-2">
            <img src="/placeholder.svg" alt="Logo" className="w-8 h-8 rounded-full bg-white" />
            <h1 className="font-bold">RobbialacSegurança</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleMenu} className="text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" 
                 stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                 className={cn("transition-transform", menuOpen ? "rotate-90" : "")}>
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </Button>
        </header>
      )}
      
      {/* Sidebar for desktop / Mobile menu */}
      <aside 
        className={cn(
          "bg-robbialac text-white",
          isMobile 
            ? cn("fixed inset-0 z-50 transition-transform transform", 
                menuOpen ? "translate-x-0" : "-translate-x-full",
                "pt-16") // Add padding top to avoid overlapping with header
            : "w-64 min-h-screen sticky top-0"
        )}
      >
        {/* Desktop logo */}
        {!isMobile && (
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
                  onClick={() => isMobile && setMenuOpen(false)}
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
      
      {/* Backdrop for mobile menu */}
      {isMobile && menuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      {/* Main content */}
      <main className={cn("flex-1 p-4 md:p-6", isMobile && "pt-20")}>
        {children}
      </main>
    </div>
  );
}
