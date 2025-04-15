import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const goHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
        <div className="mb-6 text-robbialac">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="mx-auto">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Página não encontrada</p>
        <p className="text-gray-500 mb-6">
          Parece que você tentou acessar uma página que não existe ou foi movida.
        </p>
        <Button 
          onClick={goHome} 
          className="bg-robbialac hover:bg-robbialac-dark"
        >
          Voltar para {isAuthenticated ? "o Dashboard" : "a Página de Login"}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
