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
  r2VideoKey: string;
  r2ThumbnailKey: string;
  r2Key?: string;
  thumbnailR2Key?: string;
  duration: number;
  category: "Segurança" | "Qualidade" | "Procedimentos e Regras" | "Treinamento" | "Equipamentos" | "Outros" | "Procedimentos";
  zone: "Enchimento" | "Fabrico" | "Outra";
  uploadDate: Date;
  views: number;
  pointsForWatching: number;
  status?: 'processing' | 'ready' | 'error';
  r2Qualities?: {
    high?: string;
    medium?: string;
    low?: string;
  };
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  severity: "Baixo" | "Médio" | "Alto";
  status: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  reportedBy: string;
  department: string;
  implementedAction?: string;
  responsible?: string;
  adminNotes?: string;
  pointsAwarded: number;
  completionDate?: Date;
  resolutionDeadline?: Date;
  gravityValue?: number;
  frequency?: "Baixa" | "Moderada" | "Alta";
  frequencyValue?: number;
  risk?: number;
  qaQuality?: "Baixa" | "Média" | "Alta";
  resolutionDays?: number;
  reporterName?: string;
  factoryArea?: string;
  suggestionToFix?: string;
  images?: string[];
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

export interface Accident {
  _id?: string;
  name: string;
  country: string;
  date: Date;
  pdfFile: {
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  pdfUrl?: string; // URL assinada temporária para visualização
  createdAt: Date;
  updatedAt: Date;
}

export interface Sensibilizacao {
  _id?: string;
  name: string;
  country: string;
  date: Date;
  pdfFile: {
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  pdfUrl?: string; // URL assinada temporária para visualização
  createdAt: Date;
  updatedAt: Date;
}
