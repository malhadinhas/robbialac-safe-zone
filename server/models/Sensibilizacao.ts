import mongoose, { Document, Schema } from 'mongoose';

// Interface para o documento de sensibilização
export interface ISensibilizacao extends Document {
  name: string;
  country: string;
  date: Date;
  pdfFile: {
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SensibilizacaoSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  pdfFile: {
    key: { type: String },
    originalName: { type: String },
    size: { type: Number },
    mimeType: { type: String }
  }
}, {
  timestamps: true // Isso adiciona createdAt e updatedAt automaticamente
});

// Índices para melhorar a performance das consultas
SensibilizacaoSchema.index({ date: -1 });

export default mongoose.model<ISensibilizacao>('Sensibilizacao', SensibilizacaoSchema); 