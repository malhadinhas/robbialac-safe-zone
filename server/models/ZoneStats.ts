import mongoose, { Document, Schema } from 'mongoose';

export interface IZoneStats extends Document {
  zoneId: string;
  zoneName: string;
  stats: {
    videosWatched: number;
    totalVideos: number;
    completionRate: number;
    safetyScore: number;
  };
}

const ZoneStatsSchema = new Schema<IZoneStats>({
  zoneId: { type: String, required: true },
  zoneName: { type: String, required: true },
  stats: {
    videosWatched: { type: Number, required: true },
    totalVideos: { type: Number, required: true },
    completionRate: { type: Number, required: true },
    safetyScore: { type: Number, required: true }
  }
});

export default mongoose.models.ZoneStats || mongoose.model<IZoneStats>('ZoneStats', ZoneStatsSchema); 