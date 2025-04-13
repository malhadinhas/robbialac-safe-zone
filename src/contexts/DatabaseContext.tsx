
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getDatabaseConnectionStatus, tryReconnect } from "@/services/database";
import { toast } from "sonner";

interface DatabaseContextType {
  isConnected: boolean;
  connectionError: string | null;
  checkConnection: () => Promise<boolean>;
  reconnect: () => Promise<boolean>;
  isInitializing: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Função para verificar o status da conexão
  const checkConnection = async (): Promise<boolean> => {
    console.log("DatabaseContext: Verificando status da conexão...");
    const status = getDatabaseConnectionStatus();
    console.log("DatabaseContext: Status da conexão:", status);
    setIsConnected(status.connected);
    setConnectionError(status.error);
    return status.connected;
  };

  // Função para tentar reconectar
  const reconnect = async (): Promise<boolean> => {
    try {
      console.log("DatabaseContext: Iniciando tentativa de reconexão...");
      setIsInitializing(true);
      const result = await tryReconnect();
      await checkConnection(); // Atualiza o estado após tentativa de reconexão
      
      if (result) {
        toast.success("Reconectado ao MongoDB com sucesso!");
        console.log("DatabaseContext: Reconexão bem-sucedida");
      } else {
        toast.error("Não foi possível reconectar ao MongoDB");
        console.log("DatabaseContext: Falha na reconexão");
      }
      
      setIsInitializing(false);
      return result;
    } catch (error) {
      console.error("DatabaseContext: Erro detalhado ao tentar reconectar:", error);
      toast.error("Erro ao tentar reconectar: " + (error instanceof Error ? error.message : "Erro desconhecido"));
      setIsInitializing(false);
      return false;
    }
  };

  // Verificar o status inicial da conexão
  useEffect(() => {
    const initialCheck = async () => {
      try {
        console.log("DatabaseContext: Realizando verificação inicial da conexão...");
        await checkConnection();
        console.log("DatabaseContext: Verificação inicial concluída");
      } catch (error) {
        console.error("DatabaseContext: Erro durante verificação inicial:", error);
      } finally {
        console.log("DatabaseContext: Finalizando inicialização");
        // Pequeno atraso para garantir que a interface seja renderizada
        setTimeout(() => {
          setIsInitializing(false);
          console.log("DatabaseContext: Estado isInitializing definido como false");
        }, 1000);
      }
    };

    console.log("DatabaseContext: Iniciando verificação inicial...");
    initialCheck();
    
    // Verifica a conexão periodicamente
    const interval = setInterval(() => {
      checkConnection().catch(err => console.error("Erro ao verificar conexão:", err));
    }, 60000); // Verifica a cada minuto
    
    return () => clearInterval(interval);
  }, []);

  // Mostrar notificações em caso de erros de conexão
  useEffect(() => {
    if (connectionError && !isInitializing) {
      console.log("DatabaseContext: Exibindo erro de conexão:", connectionError);
      toast.error(`Erro de conexão com o banco de dados: ${connectionError}`);
    }
  }, [connectionError, isInitializing]);

  console.log("DatabaseContext: Renderizando com estados:", { isConnected, connectionError, isInitializing });

  return (
    <DatabaseContext.Provider value={{
      isConnected,
      connectionError,
      checkConnection,
      reconnect,
      isInitializing
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
