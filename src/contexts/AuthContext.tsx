import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User } from "@/types";
import { loginUser, logoutUser, getCurrentUser } from "@/services/auth";
import { useNavigate } from 'react-router-dom';
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  updateUserPoints: (newPoints: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = getCurrentUser();
        
        // Garantir que o usuário tenha pontos iniciais
        if (currentUser && (!currentUser.points || currentUser.points === 0)) {
          const initialPoints = 100;
          currentUser.points = initialPoints;
          currentUser.level = currentUser.level || 1;
          
          // Atualizar no localStorage
          localStorage.setItem('robbialac_user', JSON.stringify(currentUser));
        }
        
        setUser(currentUser);
      } catch (error) {
        toast.error("Erro ao carregar usuário");
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const loggedUser = await loginUser(email, password);
      
      if (loggedUser) {
        setUser(loggedUser);
        toast.success(`Bem-vindo, ${loggedUser.name}!`);
        navigate('/');
      } else {
        toast.error("Email ou senha incorretos");
      }
    } catch (error) {
      toast.error((error as Error).message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    toast("Sessão encerrada");
    navigate('/login');
  };
  
  // Função para atualizar os pontos do usuário
  const updateUserPoints = (newPoints: number) => {
    if (user) {
      const updatedUser = { ...user, points: newPoints };
      setUser(updatedUser);
      localStorage.setItem('robbialac_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isLoading,
      isAuthenticated: !!user,
      updateUserPoints,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
