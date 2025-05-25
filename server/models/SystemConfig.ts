import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfig extends Document {
  annualIncidentTargetPerEmployee: number;
}

const SystemConfigSchema = new Schema<ISystemConfig>({
  annualIncidentTargetPerEmployee: { type: Number, required: true }
});

export default mongoose.models.SystemConfig || mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema); 