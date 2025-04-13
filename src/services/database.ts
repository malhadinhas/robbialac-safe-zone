import { toast } from "sonner";

interface DatabaseStatus {
  connected: boolean;
  error: string | null;
}

let cachedStatus: DatabaseStatus = {
  connected: false,
  error: null
};

export function getDatabaseConnectionStatus(): DatabaseStatus {
  return { ...cachedStatus };
}

export async function tryReconnect(): Promise<boolean> {
  try {
    const response = await fetch('/api/database/reconnect', {
      method: 'POST'
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
    
    const result = await response.json();
    cachedStatus = {
      connected: result.connected,
      error: result.error
    };
    
    return result.connected;
  } catch (error) {
    console.error('Erro ao tentar reconectar:', error);
    cachedStatus = {
      connected: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
    return false;
  }
}

// Atualizar o status periodicamente
setInterval(async () => {
  try {
    const response = await fetch('/api/database/status');
    if (response.ok) {
      const status = await response.json();
      cachedStatus = status;
    }
    } catch (error) {
    console.error('Erro ao verificar status do banco:', error);
    cachedStatus.connected = false;
    cachedStatus.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }
}, 30000); // Verifica a cada 30 segundos 