import mongoose, { Document } from 'mongoose';
import { randomUUID } from 'crypto';

// Interface para o documento de vídeo
export interface IVideo extends Document {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  duration: number;
  views: number;
  category: string;
  zone: string;
  pointsForWatching: number;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    default: () => randomUUID()
  },
  title: {
    type: String,
    required: [true, 'O título é obrigatório'],
    trim: true,
    minlength: [3, 'O título deve ter pelo menos 3 caracteres'],
    maxlength: [100, 'O título não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    required: [true, 'A descrição é obrigatória'],
    trim: true,
    minlength: [10, 'A descrição deve ter pelo menos 10 caracteres'],
    maxlength: [1000, 'A descrição não pode ter mais de 1000 caracteres']
  },
  url: {
    type: String,
    required: [true, 'A URL é obrigatória'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'A URL deve começar com http:// ou https://'
    }
  },
  thumbnail: {
    type: String,
    required: [true, 'A thumbnail é obrigatória'],
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'A URL da thumbnail deve começar com http:// ou https://'
    }
  },
  duration: {
    type: Number,
    required: [true, 'A duração é obrigatória'],
    min: [0, 'A duração não pode ser negativa']
  },
  views: {
    type: Number,
    default: 0,
    min: [0, 'O número de visualizações não pode ser negativo']
  },
  category: {
    type: String,
    required: [true, 'A categoria é obrigatória'],
    trim: true,
    enum: {
      values: ['Segurança', 'Qualidade', 'Procedimentos e Regras'],
      message: 'Categoria inválida. Deve ser: Segurança, Qualidade ou Procedimentos e Regras'
    }
  },
  zone: {
    type: String,
    required: [true, 'A zona é obrigatória'],
    trim: true,
    enum: {
      values: ['Zona 1', 'Zona 2', 'Zona 3', 'Zona 4', 'Zona 5', 'Geral'],
      message: 'Zona inválida. Deve ser uma das zonas definidas ou Geral'
    }
  },
  pointsForWatching: {
    type: Number,
    required: [true, 'Os pontos por visualização são obrigatórios'],
    min: [0, 'Os pontos não podem ser negativos'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Índices
videoSchema.index({ category: 1 });
videoSchema.index({ zone: 1 });
videoSchema.index({ views: -1 });

// Middleware para atualizar updatedAt antes de salvar
videoSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.updatedAt = new Date();
  }
  next();
});

// Método estático para buscar vídeos por categoria
videoSchema.statics.findByCategory = function(category: string) {
  return this.find({ category });
};

// Método estático para buscar vídeos por zona
videoSchema.statics.findByZone = function(zone: string) {
  return this.find({ zone });
};

// Método de instância para incrementar visualizações
videoSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Criar e exportar o modelo
const Video = mongoose.model<IVideo>('Video', videoSchema);
export default Video; 