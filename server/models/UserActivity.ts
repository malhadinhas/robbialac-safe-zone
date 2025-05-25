import mongoose, { Document, Schema } from 'mongoose';

export interface IUserActivity extends Document {
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

const userActivitySchema = new Schema<IUserActivity>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: Schema.Types.Mixed,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const UserActivity = mongoose.model<IUserActivity>('UserActivity', userActivitySchema); 