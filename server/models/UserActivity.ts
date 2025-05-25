import mongoose, { Document, Schema } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  category: 'video' | 'incident' | 'training' | 'medal';
  activityId?: string;
  points?: number;
  timestamp: Date;
  details?: Record<string, unknown>;
}

const UserActivitySchema = new Schema<IUserActivity>({
  userId: { type: String, required: true },
  category: { type: String, required: true, enum: ['video', 'incident', 'training', 'medal'] },
  activityId: { type: String },
  points: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  details: { type: Schema.Types.Mixed }
});

export default mongoose.models.UserActivity || mongoose.model<IUserActivity>('UserActivity', UserActivitySchema); 