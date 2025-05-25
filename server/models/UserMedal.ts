import mongoose, { Document, Schema } from 'mongoose';

export interface IUserMedal extends Document {
  userId: string;
  medalId: string;
  dateEarned: Date;
  created_at?: Date;
  updated_at?: Date;
}

const UserMedalSchema = new Schema<IUserMedal>({
  userId: { type: String, required: true },
  medalId: { type: String, required: true },
  dateEarned: { type: Date, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.models.UserMedal || mongoose.model<IUserMedal>('UserMedal', UserMedalSchema); 