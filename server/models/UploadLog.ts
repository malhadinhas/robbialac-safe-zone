import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadLog extends Document {
  userId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'r2' | 'local' | 'other';
  fileKey?: string;
  timestamp: Date;
}

const UploadLogSchema = new Schema<IUploadLog>({
  userId: { type: String },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  storageType: { type: String, required: true, enum: ['r2', 'local', 'other'] },
  fileKey: { type: String },
  timestamp: { type: Date, required: true }
});

export default mongoose.models.UploadLog || mongoose.model<IUploadLog>('UploadLog', UploadLogSchema); 