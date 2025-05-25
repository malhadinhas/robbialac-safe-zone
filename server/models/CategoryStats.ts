import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryStats extends Document {
  categoryId: string;
  title: string;
  description: string;
  videosCompleted: number;
  totalVideos: number;
  iconName: string;
}

const CategoryStatsSchema = new Schema<ICategoryStats>({
  categoryId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  videosCompleted: { type: Number, required: true },
  totalVideos: { type: Number, required: true },
  iconName: { type: String, required: true }
});

export default mongoose.models.CategoryStats || mongoose.model<ICategoryStats>('CategoryStats', CategoryStatsSchema); 