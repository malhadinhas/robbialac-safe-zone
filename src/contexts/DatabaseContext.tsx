
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

  // Function to check connection status
  const checkConnection = async (): Promise<boolean> => {
    console.log("DatabaseContext: Checking connection status...");
    const status = getDatabaseConnectionStatus();
    console.log("DatabaseContext: Got connection status:", status);
    
    // Update state based on connection status
    setIsConnected(status.connected);
    
    if (status.error !== connectionError) {
      console.log("DatabaseContext: Connection error changed:", status.error);
      setConnectionError(status.error);
    }
    
    return status.connected;
  };

  // Function to attempt reconnection
  const reconnect = async (): Promise<boolean> => {
    try {
      console.log("DatabaseContext: Starting reconnection attempt...");
      setIsInitializing(true);
      
      const result = await tryReconnect();
      await checkConnection(); // Update state after reconnection attempt
      
      if (result) {
        toast.success("Successfully reconnected to MongoDB!");
        console.log("DatabaseContext: Reconnection successful");
      } else {
        toast.error("Failed to reconnect to MongoDB");
        console.log("DatabaseContext: Reconnection failed");
      }
      
      setIsInitializing(false);
      return result;
    } catch (error) {
      console.error("DatabaseContext: Detailed error during reconnection attempt:", error);
      toast.error("Error during reconnection: " + (error instanceof Error ? error.message : "Unknown error"));
      setIsInitializing(false);
      return false;
    }
  };

  // Check initial connection status
  useEffect(() => {
    console.log("DatabaseContext: Initial mount, checking connection...");
    
    const initialCheck = async () => {
      try {
        console.log("DatabaseContext: Running initial connection check...");
        await checkConnection();
        console.log("DatabaseContext: Initial connection check completed");
      } catch (error) {
        console.error("DatabaseContext: Error during initial connection check:", error);
        setConnectionError(error instanceof Error ? error.message : "Unknown error during connection check");
      } finally {
        // Small delay to ensure the interface is rendered
        setTimeout(() => {
          console.log("DatabaseContext: Setting isInitializing to false");
          setIsInitializing(false);
        }, 2000);
      }
    };

    initialCheck();
    
    // Check connection periodically
    const interval = setInterval(() => {
      checkConnection().catch(err => console.error("Periodic connection check error:", err));
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Display connection error notifications
  useEffect(() => {
    if (connectionError && !isInitializing) {
      console.log("DatabaseContext: Showing connection error toast:", connectionError);
      toast.error(`Database connection error: ${connectionError}`);
    }
  }, [connectionError, isInitializing]);

  console.log("DatabaseContext: Rendering with states:", { 
    isConnected, 
    connectionError, 
    isInitializing 
  });

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
