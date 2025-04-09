
export type UserRole = "admin_app" | "admin_qa" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  points: number;
  level: number;
  medals: Medal[];
  viewedVideos: string[];
  reportedIncidents: string[];
}

export interface Medal {
  id: string;
  name: string;
  description: string;
  image: string;
  acquired: boolean;
  acquiredDate?: Date;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  category: "Segurança" | "Qualidade" | "Procedimentos e Regras";
  zone: "Enchimento" | "Fabrico" | "Outra";
  uploadDate: Date;
  views: number;
  pointsForWatching: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  reportedBy: string;
  severity: "Baixo" | "Médio" | "Alto";
  status: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  images?: string[];
  adminNotes?: string;
  resolution?: string;
  pointsAwarded: number;
  department?: string;
  
  // New fields added based on Excel requirements
  implementedAction?: string;
  completionDate?: Date;
  responsible?: string;
  frequency?: "Baixa" | "Moderada" | "Alta"; // 2-Baixa, 6-Moderada, 8-Alta
  frequencyValue?: number; // Numerical value of frequency
  gravityValue?: number; // 1-Baixa, 4-Moderada, 7-Alta
  risk?: number; // Calculated field (frequency * gravity)
  qaQuality?: "Baixa" | "Média" | "Alta"; // Alta>24, Media 8 ou 14, Baixa <6
  resolutionDays?: number;
  resolutionDeadline?: Date;
}

export interface StatsByCategory {
  category: string;
  count: number;
  color: string;
}

export interface StatsByZone {
  zone: string;
  count: number;
  color: string;
}

export interface StatsBySeverity {
  severity: string;
  count: number;
  color: string;
}

export interface Department {
  name: string;
  employeeCount: number;
  color: string;
}

export interface SystemConfig {
  annualIncidentTargetPerEmployee: number;
}
