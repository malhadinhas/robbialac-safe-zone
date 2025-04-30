import { ObjectId } from 'mongodb';

export type UserRole = 'admin_app' | 'admin_qa' | 'user';
// Define os papéis possíveis de um utilizador na aplicação.

export interface User {
  id: string;                // Identificador único do utilizador
  email: string;             // Email do utilizador
  password: string;          // Hash da password do utilizador
  name: string;              // Nome do utilizador
  role: UserRole;            // Papel do utilizador (admin_app, admin_qa, user)
  points: number;            // Pontos acumulados (gamificação)
  level: number;             // Nível do utilizador (gamificação)
  medals: string[];          // Lista de medalhas/conquistas
  viewedVideos: string[];    // IDs dos vídeos já vistos
  reportedIncidents: string[]; // IDs dos incidentes reportados
}

export interface Video {
  id: string;                // Identificador único do vídeo
  title: string;             // Título do vídeo
  description: string;       // Descrição do vídeo
  url: string;               // URL do vídeo (pode ser local ou R2)
  thumbnailUrl: string;      // URL da thumbnail do vídeo
  category: 'safety' | 'training' | 'procedure'; // Categoria do vídeo
  uploadDate: Date;          // Data de upload
  views: number;             // Número de visualizações
  duration: number;          // Duração do vídeo em segundos
}

export interface Incident {
  id: string;                // Identificador único do incidente
  title: string;             // Título do incidente
  description: string;       // Descrição detalhada
  location: string;          // Localização do incidente
  date: Date;                // Data do incidente
  status: 'Reportado' | 'Em Análise' | 'Resolvido' | 'Arquivado'; // Estado do incidente
  severity: 'Baixo' | 'Médio' | 'Alto'; // Severidade
  reportedBy: string;        // Email ou ID do utilizador que reportou
  department: string;        // Departamento associado
  implementedAction?: string; // Ação implementada (opcional)
  responsible?: string;      // Responsável pela resolução (opcional)
  adminNotes?: string;       // Notas administrativas (opcional)
  pointsAwarded: number;     // Pontos atribuídos pelo incidente
  completionDate?: Date;     // Data de conclusão (opcional)
  resolutionDeadline?: Date; // Prazo de resolução (opcional)
  gravityValue?: number;     // Valor de gravidade (opcional)
  frequency?: 'Baixa' | 'Moderada' | 'Alta'; // Frequência (opcional)
  frequencyValue?: number;   // Valor de frequência (opcional)
  risk?: number;             // Valor de risco calculado (opcional)
  qaQuality?: 'Baixa' | 'Média' | 'Alta'; // Qualidade do QA (opcional)
  resolutionDays?: number;   // Dias para resolução (opcional)
  reporterName?: string;     // Nome do utilizador que reportou (opcional)
  factoryArea?: string;      // Área da fábrica (opcional)
  suggestionToFix?: string;  // Sugestão de correção (opcional)
  images?: string[];         // URLs das imagens associadas (opcional)
}

export interface LoginEvent {
  _id?: ObjectId;            // ID do MongoDB (opcional)
  userId: string;            // ID do utilizador
  userEmail: string;         // Email do utilizador
  timestamp: Date;           // Data/hora do login
  ipAddress?: string;        // IP do utilizador (opcional)
  userAgent?: string;        // User agent do browser (opcional)
}

export interface UploadLog {
  _id?: ObjectId;            // ID do MongoDB (opcional)
  userId?: string;           // ID do utilizador (opcional)
  fileName: string;          // Nome do ficheiro
  fileSize: number;          // Tamanho em bytes
  mimeType: string;          // Tipo MIME do ficheiro
  storageType: 'r2' | 'local' | 'other'; // Onde foi armazenado
  fileKey?: string;          // Chave do ficheiro no R2 (opcional)
  timestamp: Date;           // Data/hora do upload
}

export interface DatabaseConfig {
  uri: string;               // String de conexão do MongoDB
  dbName: string;            // Nome da base de dados
} 