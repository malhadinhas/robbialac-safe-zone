
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDatabaseConnectionStatus } from "@/services/database";
import { toast } from "sonner";

interface DatabaseContextType {
  isConnected: boolean;
  connectionError: string | null;
  checkConnection: () => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Função para verificar o status da conexão
  const checkConnection = async (): Promise<boolean> => {
    const status = getDatabaseConnectionStatus();
    setIsConnected(status.connected);
    setConnectionError(status.error);
    return status.connected;
  };

  // Verificar o status inicial da conexão
  useEffect(() => {
    const initialCheck = async () => {
      await checkConnection();
    };

    initialCheck();
  }, []);

  // Mostrar notificações em caso de erros de conexão
  useEffect(() => {
    if (connectionError) {
      toast.error(`Erro de conexão com o banco de dados: ${connectionError}`);
    }
  }, [connectionError]);

  return (
    <DatabaseContext.Provider value={{
      isConnected,
      connectionError,
      checkConnection,
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  
  return context;
};
