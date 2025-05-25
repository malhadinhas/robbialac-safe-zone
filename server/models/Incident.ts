import mongoose, { Schema, Document } from 'mongoose';

export interface IIncident extends Document {
  title: string;
  description: string;
  date: Date;
  location?: string;
  reportedBy: string; // id do utilizador
  status: 'open' | 'closed' | 'in_progress';
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String },
  reportedBy: { type: String, required: true },
  status: { type: String, enum: ['open', 'closed', 'in_progress'], default: 'open' },
  category: { type: String },
}, {
  timestamps: true
});

export default mongoose.model<IIncident>('Incident', IncidentSchema); 