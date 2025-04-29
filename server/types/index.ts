export type UserRole = 'admin_app' | 'admin_qa' | 'user';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  points: number;
  level: number;
  medals: string[];
  viewedVideos: string[];
  reportedIncidents: string[];
}

export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  category: 'safety' | 'training' | 'procedure';
  uploadDate: Date;
  views: number;
  duration: number;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  status: 'Reportado' | 'Em Análise' | 'Resolvido' | 'Arquivado';
  severity: 'Baixo' | 'Médio' | 'Alto';
  reportedBy: string;
  department: string;
  implementedAction?: string;
  responsible?: string;
  adminNotes?: string;
  pointsAwarded: number;
  completionDate?: Date;
  resolutionDeadline?: Date;
  gravityValue?: number;
  frequency?: 'Baixa' | 'Moderada' | 'Alta';
  frequencyValue?: number;
  risk?: number;
  qaQuality?: 'Baixa' | 'Média' | 'Alta';
  resolutionDays?: number;
  reporterName?: string;
  factoryArea?: string;
  suggestionToFix?: string;
  images?: string[];
}

export interface LoginEvent {
  _id?: ObjectId; // ID do MongoDB
  userId: string;
  userEmail: string; // Pode ser útil para análise
  timestamp: Date;
  ipAddress?: string; // Opcional, se conseguirmos obter do request
  userAgent?: string; // Opcional, se conseguirmos obter do request
}

export interface UploadLog {
  _id?: ObjectId; // ID do MongoDB
  userId?: string; // ID do usuário que fez upload (se disponível)
  fileName: string;
  fileSize: number; // Tamanho em bytes
  mimeType: string;
  storageType: 'r2' | 'local' | 'other'; // Onde foi armazenado
  fileKey?: string; // Chave do arquivo no R2 (se aplicável)
  timestamp: Date;
}

export interface DatabaseConfig {
  uri: string;
  dbName: string;
} 