import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  name: string;
  role: string;
  points: number;
  level: number;
  medals: string[];
  viewedVideos: string[];
  reportedIncidents: string[];
  verificationCode?: string;
  isVerified?: boolean;
  avatarUrl?: string;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  medals: { type: [String], default: [] },
  viewedVideos: { type: [String], default: [] },
  reportedIncidents: { type: [String], default: [] },
  verificationCode: { type: String },
  isVerified: { type: Boolean, default: false },
  avatarUrl: { type: String }
}, {
  timestamps: true
});

export default mongoose.model<IUser>('User', UserSchema); 