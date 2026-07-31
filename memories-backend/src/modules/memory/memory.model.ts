import { Schema, model } from 'mongoose';
import { MemoryBlockSchema } from './memory-block.schema.js';
import type { MemoryRecord } from './memory.types.js';

const MemoryLocationSchema = new Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    placeName: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const MemorySchema = new Schema<MemoryRecord>(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    blocks: { type: [MemoryBlockSchema], default: [] },
    coverMedia: { type: Schema.Types.ObjectId, ref: 'Media' },
    happenedAt: { type: Date, index: true },
    location: MemoryLocationSchema,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    moods: [{ type: String, trim: true, maxlength: 50 }],
    favorite: { type: Boolean, default: false, index: true },
    publishedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

MemorySchema.index({ happenedAt: -1, publishedAt: -1 });
MemorySchema.index({ tags: 1, happenedAt: -1 });
MemorySchema.index({ title: 'text' });

export const Memory = model<MemoryRecord>('Memory', MemorySchema);
