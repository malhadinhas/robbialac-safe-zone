import mongoose, { Document, Schema } from 'mongoose';

export interface IMedal extends Document {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  triggerAction: 'incidentReported' | 'videoWatched' | 'trainingCompleted';
  triggerCategory?: string;
  requiredCount: number;
  created_at?: Date;
  updated_at?: Date;
}

const MedalSchema = new Schema<IMedal>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageSrc: { type: String, required: true },
  triggerAction: { type: String, required: true, enum: ['incidentReported', 'videoWatched', 'trainingCompleted'] },
  triggerCategory: { type: String },
  requiredCount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.Medal || mongoose.model<IMedal>('Medal', MedalSchema); 