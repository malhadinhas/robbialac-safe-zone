
import { Incident } from "@/types";
import { getCollection } from "./database";

export async function getIncidents(): Promise<Incident[]> {
  try {
    const collection = await getCollection<Incident>("incidents");
    const incidents = await collection.find({}).toArray();
    console.log(`Recuperados ${incidents.length} incidentes do MongoDB Atlas`);
    return incidents.map(incident => ({
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
    const collection = await getCollection<Incident>("incidents");
    const incident = await collection.findOne({ id });
    
    if (incident) {
      return {
        ...incident,
        date: new Date(incident.date),
        completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
        resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao buscar incidente por ID:", error);
    throw error;
  }
}

export async function createIncident(incident: Omit<Incident, "id">): Promise<Incident> {
  try {
    const collection = await getCollection("incidents");
    const newIncident = {
      ...incident,
      id: crypto.randomUUID()
    };
    
    await collection.insertOne(newIncident);
    console.log(`Novo incidente criado com ID: ${newIncident.id}`);
    return newIncident;
  } catch (error) {
    console.error("Erro ao criar incidente:", error);
    throw error;
  }
}

export async function updateIncident(incident: Incident): Promise<void> {
  try {
    const collection = await getCollection("incidents");
    const { id, ...dataToUpdate } = incident;
    await collection.updateOne({ id }, { $set: dataToUpdate });
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
