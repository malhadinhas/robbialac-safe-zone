import { Incident } from "@/types";
import api from '@/lib/api';

export async function getIncidents(): Promise<Incident[]> {
  try {
    const response = await api.get('/incidents');
    return response.data.map((incident: Incident) => ({
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    }));
  } catch (error) {
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

export async function updateIncident(incident: Incident): Promise<void> {
  try {
    const { _id, ...incidentWithoutId } = incident;
    await api.put(`/incidents/${incident.id}`, incidentWithoutId);
  } catch (error) {
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

export async function getIncidentsByDepartment(): Promise<IncidentsByDepartment> {
  try {
    const response = await api.get('/api/incidents/by-department');
    return response.data;
  } catch (error) {
    throw error;
  }
}
