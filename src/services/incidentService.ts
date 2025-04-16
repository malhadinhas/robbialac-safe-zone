import { Incident } from "@/types";
import api from '@/lib/api';

export async function getIncidents(status?: 'active' | 'archived'): Promise<Incident[]> {
  try {
    let url = '/incidents';
    if (status) {
      url += `?status=${status === 'active' ? 'not_archived' : 'archived'}`;
    }
    const response = await api.get(url);
    return response.data.map((incident: any) => ({
      ...incident,
      date: incident.date ? new Date(incident.date) : new Date(),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    }));
  } catch (error) {
    console.error("Erro ao buscar incidentes:", error);
    throw error;
  }
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  try {
    const response = await api.get(`/incidents/${id}`);
    const incident = response.data;
    return {
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createIncident(incident: Omit<Incident, "id">): Promise<Incident> {
  try {
    const response = await api.post('/incidents', incident);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateIncident(id: string, updateData: Partial<Omit<Incident, '_id' | 'id'>>): Promise<void> {
  try {
    await api.put(`/incidents/${id}`, updateData);
  } catch (error) {
    console.error("Erro ao atualizar incidente:", error);
    throw error;
  }
}

// Helper function to convert a File to base64 string
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Helper function to handle camera capture (mobile specific)
export async function captureImage(): Promise<string | null> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API not supported");
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.srcObject = stream;
      video.play();
      
      video.onplaying = () => {
        try {
          const { videoWidth, videoHeight } = video;
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          
          const context = canvas.getContext('2d');
          if (!context) throw new Error("Could not get canvas context");
          
          context.drawImage(video, 0, 0, videoWidth, videoHeight);
          stream.getTracks().forEach(track => track.stop());
          
          const imageData = canvas.toDataURL('image/jpeg');
          resolve(imageData);
        } catch (err) {
          reject(err);
        }
      };
      
      video.onerror = () => {
        stream.getTracks().forEach(track => track.stop());
        reject(new Error("Error accessing video stream"));
      };
    });
  } catch (error) {
    return null;
  }
}

/**
 * Obtém estatísticas de incidentes por departamento
 */
export async function getIncidentStatsByDepartment(): Promise<{ department: string; count: number }[]> {
  try {
    const response = await api.get('/incidents/stats/by-department');
    return response.data;
  } catch (error) {
    // Se estiver em desenvolvimento ou teste, retornamos dados simulados
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      return [
        { department: "Produção", count: 24 },
        { department: "Manutenção", count: 18 },
        { department: "Logística", count: 12 },
        { department: "Administrativo", count: 3 },
        { department: "Qualidade", count: 7 },
        { department: "Segurança", count: 6 }
      ];
    }
    
    throw error;
  }
}

interface IncidentsByDepartment {
  [departmentId: string]: number;
}

export async function getIncidentsByDepartment(year?: number): Promise<{ department: string; count: number }[]> {
  try {
    // Constrói a URL com o parâmetro de ano, se fornecido
    const url = year ? `/incidents/by-department?year=${year}` : '/incidents/by-department';
    const response = await api.get(url);
    // Removido o log daqui, pois estava no sítio errado
    // console.warn('[incidentService] Resposta BRUTA de /incidents/by-department:', response.data);
    return response.data;
  } catch (error) {
    // Logar o erro e retornar array vazio para não quebrar o frontend
    console.error("Erro ao buscar incidentes por departamento:", error);
    return []; 
  }
}

export async function deleteIncident(id: string): Promise<void> {
  try {
    await api.delete(`/incidents/${id}`);
  } catch (error) {
    console.error("Erro ao apagar incidente:", error);
    throw error;
  }
}
