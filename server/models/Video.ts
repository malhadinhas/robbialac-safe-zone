import mongoose, { Schema, Document } from 'mongoose';
import { randomUUID } from 'crypto';

// Interface para o documento de vídeo
export interface IVideo extends Document {
  videoId: string;
  title: string;
  description: string;
  r2VideoKey: string;
  r2ThumbnailKey: string;
  category: string;
  zone?: string;
  duration?: number;
  views: number;
  uploadDate: Date;
  r2Qualities?: {
    high?: string;
    medium?: string;
    low?: string;
  };
  status: 'processing' | 'ready' | 'error';
  processingError?: string;
}

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
  timestamps: true
});

// Índices para melhorar a performance das consultas
VideoSchema.index({ category: 1 });
VideoSchema.index({ views: -1 });
VideoSchema.index({ uploadDate: -1 });
VideoSchema.index({ videoId: 1 }, { unique: true });

// Middleware para garantir que o documento nunca tenha id null
VideoSchema.pre('save', function(next) {
  // Atualiza updatedAt
  if (this.isModified()) {
    this.updatedAt = new Date();
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