
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDatabaseConnectionStatus, tryReconnect } from "@/services/database";
import { toast } from "sonner";

interface DatabaseContextType {
  isConnected: boolean;
  connectionError: string | null;
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
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

  // Função para tentar reconectar
  const reconnect = async (): Promise<boolean> => {
    try {
      const result = await tryReconnect();
      await checkConnection(); // Atualiza o estado após tentativa de reconexão
      
      if (result) {
        toast.success("Reconectado ao MongoDB com sucesso!");
      } else {
        toast.error("Não foi possível reconectar ao MongoDB");
      }
      
      return result;
    } catch (error) {
      toast.error("Erro ao tentar reconectar: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      return false;
    }
  };

  // Verificar o status inicial da conexão
  useEffect(() => {
    const initialCheck = async () => {
      await checkConnection();
    };

    initialCheck();
    
    // Verifica a conexão periodicamente
    const interval = setInterval(() => {
      checkConnection().catch(console.error);
    }, 60000); // Verifica a cada minuto
    
    return () => clearInterval(interval);
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
      reconnect,
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
