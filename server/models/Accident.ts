import mongoose, { Schema, Document } from 'mongoose';

export interface IAccident extends Document {
  name: string;
  country: string;
  date: Date;
  pdfFile?: {
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AccidentSchema: Schema = new Schema({
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
AccidentSchema.index({ date: -1 });
AccidentSchema.index({ country: 1 });

export default mongoose.model<IAccident>('Accident', AccidentSchema); 