import { Schema } from 'mongoose';
import { memoryBlockTypes, type MemoryBlock } from './memory.types.js';

/**
 * A block is an ordered moment in a memory. Type-specific data belongs in
 * `content`, for example `{ text }`, `{ mediaId }`, `{ mediaIds }`, or
 * `{ latitude, longitude, placeName }`.
 */
export const MemoryBlockSchema = new Schema<MemoryBlock>(
  {
    type: { type: String, enum: memoryBlockTypes, required: true },
    position: { type: Number, required: true, min: 0 },
    caption: { type: String, trim: true, maxlength: 500 },
    content: { type: Schema.Types.Mixed, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: true },
);
