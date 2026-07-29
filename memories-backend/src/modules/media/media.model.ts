import { Schema, model } from 'mongoose';
import { mediaProcessingStates, mediaTypes, type MediaRecord } from './media.types.js';

const MediaLocationSchema = new Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    placeName: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false },
);

const MediaSchema = new Schema<MediaRecord>(
  {
    // R2 object keys are stored rather than public URLs. A future CDN or
    // custom-domain change then requires no database migration.
    key: { type: String, required: true, trim: true, unique: true, index: true },
    previewKey: { type: String, trim: true },
    thumbnailKey: { type: String, trim: true },
    type: { type: String, enum: mediaTypes, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    takenAt: { type: Date, index: true },
    location: { type: MediaLocationSchema },
    hash: { type: String, trim: true, index: true, sparse: true },
    processingState: {
      type: String,
      enum: mediaProcessingStates,
      default: 'pending',
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

MediaSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

export const Media = model<MediaRecord>('Media', MediaSchema);
