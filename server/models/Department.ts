import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  description: { 
    type: String
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para melhorar a performance das consultas
DepartmentSchema.index({ name: 1 });
DepartmentSchema.index({ active: 1 });

export default mongoose.model<IDepartment>('Department', DepartmentSchema); 