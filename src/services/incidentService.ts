
import { Incident } from "@/types";
import { getCollection } from "./database";
import { mockIncidents } from "./mockData";

export async function getIncidents(): Promise<Incident[]> {
  try {
    const collection = await getCollection("incidents");
    const count = await collection.countDocuments();
    
    // Se não houver documentos, inicializa com os dados mockados
    if (count === 0) {
      console.log("Inicializando coleção de incidentes com dados mockados");
      await collection.insertMany(mockIncidents);
    }
    
    const incidents = await collection.find<Incident>({}).toArray();
    return incidents.map(incident => ({
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    }));
  } catch (error) {
    console.error("Erro ao buscar incidentes:", error);
    // Em caso de erro, retorna os dados mockados
    return mockIncidents;
  }
}

export async function getIncidentById(id: string): Promise<Incident | null> {
  try {
    const collection = await getCollection("incidents");
    const incident = await collection.findOne<Incident>({ id });
    
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
    // Em caso de erro, retorna o incidente dos dados mockados
    return mockIncidents.find(i => i.id === id) || null;
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
