import mongoose, { Document, Schema } from 'mongoose';

export interface ILoginEvent extends Document {
  userId: string;
  userEmail: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const LoginEventSchema = new Schema<ILoginEvent>({
  userId: { type: String, required: true },
  userEmail: { type: String, required: true },
  timestamp: { type: Date, required: true },
  ipAddress: { type: String },
  userAgent: { type: String }
});

export default mongoose.models.LoginEvent || mongoose.model<ILoginEvent>('LoginEvent', LoginEventSchema); 