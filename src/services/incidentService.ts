import { Incident } from "@/types";

export async function getIncidents(): Promise<Incident[]> {
  try {
    const response = await fetch('/api/incidents');
    if (!response.ok) {
      throw new Error('Erro ao buscar incidentes');
    }
    const incidents = await response.json();
    console.log(`Recuperados ${incidents.length} incidentes`);
    return incidents.map((incident: Incident) => ({
      ...incident,
      date: new Date(incident.date),
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
    const response = await fetch(`/api/incidents/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Erro ao buscar incidente');
    }
    const incident = await response.json();
    return {
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    };
  } catch (error) {
    console.error("Erro ao buscar incidente por ID:", error);
    throw error;
  }
}

export async function createIncident(incident: Omit<Incident, "id">): Promise<Incident> {
  try {
    const response = await fetch('/api/incidents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incident)
    });
    if (!response.ok) {
      throw new Error('Erro ao criar incidente');
    }
    const newIncident = await response.json();
    console.log(`Novo incidente criado com ID: ${newIncident.id}`);
    return newIncident;
  } catch (error) {
    console.error("Erro ao criar incidente:", error);
    throw error;
  }
}

export async function updateIncident(incident: Incident): Promise<void> {
  try {
    const { _id, ...incidentWithoutId } = incident;
    
    const response = await fetch(`/api/incidents/${incident.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(incidentWithoutId)
    });
    
    if (!response.ok) {
      let errorMessage = 'Erro ao atualizar incidente';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.details || errorData.error || errorMessage;
      } catch (e) {
        // Se não conseguir extrair o JSON, usa o status text
        errorMessage = response.statusText || errorMessage;
      }
      
      // Cria um erro mais detalhado que mantém a resposta original
      const error: any = new Error(errorMessage);
      error.response = {
        status: response.status,
        data: { error: errorMessage }
      };
      
      throw error;
    }
  } catch (error) {
    console.error("Erro ao atualizar incidente:", error);
    
    // Se o erro já tiver uma propriedade response, propagamos como está
    if ((error as any).response) {
      throw error;
    }
    
    // Caso contrário, criamos um erro com o formato esperado
    const enhancedError: any = new Error(error instanceof Error ? error.message : 'Erro desconhecido');
    enhancedError.response = {
      status: 500,
      data: { error: enhancedError.message }
    };
    
    throw enhancedError;
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
      // Create video and canvas elements for capturing
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      
      video.srcObject = stream;
      video.play();
      
      // Take snapshot after video is playing
      video.onplaying = () => {
        try {
          const { videoWidth, videoHeight } = video;
          canvas.width = videoWidth;
          canvas.height = videoHeight;
          
          // Draw video frame to canvas
          const context = canvas.getContext('2d');
          if (!context) throw new Error("Could not get canvas context");
          
          context.drawImage(video, 0, 0, videoWidth, videoHeight);
          
          // Stop all video tracks
          stream.getTracks().forEach(track => track.stop());
          
          // Convert canvas to base64
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
    console.error("Error capturing image:", error);
    return null;
  }
}
