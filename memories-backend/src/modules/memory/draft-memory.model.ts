import { Schema, model } from 'mongoose';
import { MemoryBlockSchema } from './memory-block.schema.js';
import { draftSources, draftStatuses, type DraftMemoryRecord } from './memory.types.js';

const DraftLocationSchema = new Schema(
  {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    placeName: { type: String, trim: true, maxlength: 200 },
    address: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const DraftSuggestionSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 160 },
    summary: { type: String, trim: true, maxlength: 2_000 },
    moods: [{ type: String, trim: true, maxlength: 50 }],
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false },
);

const DraftMemorySchema = new Schema<DraftMemoryRecord>(
  {
    source: { type: String, enum: draftSources, required: true },
    status: { type: String, enum: draftStatuses, required: true, default: 'in_progress', index: true },
    title: { type: String, trim: true, maxlength: 160 },
    blocks: { type: [MemoryBlockSchema], default: [] },
    // Media is uploaded independently. This list lets the curation screen
    // show uploaded media before the user arranges it into story blocks.
    candidateMedia: [{ type: Schema.Types.ObjectId, ref: 'Media' }],
    coverMedia: { type: Schema.Types.ObjectId, ref: 'Media' },
    happenedAt: { type: Date, index: true },
    location: DraftLocationSchema,
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    moods: [{ type: String, trim: true, maxlength: 50 }],
    suggestion: DraftSuggestionSchema,
    resolvedMemory: { type: Schema.Types.ObjectId, ref: 'Memory', index: true },
  },
  { timestamps: true },
);

DraftMemorySchema.index({ status: 1, updatedAt: -1 });

export const DraftMemory = model<DraftMemoryRecord>('DraftMemory', DraftMemorySchema);
