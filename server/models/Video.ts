import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

// Interface TypeScript que define a estrutura de um documento de Vídeo
export interface IVideo extends Document {
  videoId: string;                // ID único do vídeo (string UUID)
  title: string;                  // Título do vídeo
  description: string;            // Descrição do vídeo
  r2VideoKey: string;             // Chave do vídeo no storage (ex: Cloudflare R2)
  r2ThumbnailKey: string;         // Chave da thumbnail no storage
  category: string;               // Categoria do vídeo
  zone?: string;                  // Zona associada ao vídeo (opcional)
  duration?: number;              // Duração do vídeo em segundos (opcional)
  views: number;                  // Número de visualizações
  uploadDate: Date;               // Data de upload
  r2Qualities?: {                 // Chaves para diferentes qualidades do vídeo (opcional)
    high?: string;
    medium?: string;
    low?: string;
  };
  status: 'processing' | 'ready' | 'error'; // Estado do vídeo
  processingError?: string;       // Mensagem de erro de processamento (opcional)
}

// Definição do schema do Mongoose para Video
const VideoSchema = new Schema<IVideo>({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  r2VideoKey: {
    type: String,
    required: true
  },
  r2ThumbnailKey: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Segurança', 'Qualidade', 'Procedimentos e Regras', 'Treinamento', 'Equipamentos', 'Outros', 'Procedimentos']
  },
  zone: {
    type: String,
    required: false
  },
  duration: {
    type: Number,
    required: false
  },
  views: {
    type: Number,
    default: 0
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  r2Qualities: {
    high: String,
    medium: String,
    low: String
  },
  status: {
    type: String,
    enum: ['processing', 'ready', 'error'],
    default: 'processing'
  },
  processingError: {
    type: String
  }
}, {
  timestamps: true // Adiciona automaticamente createdAt e updatedAt
});

// Índices para melhorar a performance das consultas
VideoSchema.index({ category: 1 });           // Para buscas por categoria
VideoSchema.index({ views: -1 });             // Para ordenar por visualizações
VideoSchema.index({ uploadDate: -1 });        // Para ordenar por data de upload
VideoSchema.index({ videoId: 1 }, { unique: true }); // Garante unicidade do videoId

// Middleware para garantir que o documento nunca tenha id null
VideoSchema.pre('save', function(next) {
  // Atualiza updatedAt
  if (this.isModified()) {
    if ('updatedAt' in this) {
      (this as { updatedAt?: Date }).updatedAt = new Date();
    }
  }
  // Garante que o id não seja nulo
  if (this.id === null || this.id === undefined) {
    this.id = this._id;
  }
  next();
});

// Método estático para buscar vídeos por categoria
VideoSchema.statics.findByCategory = function(category: string) {
  return this.find({ category });
};

// Método estático para buscar vídeos por zona
VideoSchema.statics.findByZone = function(zone: string) {
  return this.find({ zone });
};

// Método de instância para incrementar visualizações
VideoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Criar e exportar o modelo
const Video = mongoose.model<IVideo>('Video', VideoSchema);
export default Video;

// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para vídeos na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar vídeos de forma tipada e validada.
// Garante consistência, performance e funcionalidades extra (como métodos utilitários) nas operações relacionadas a vídeos na aplicação. 