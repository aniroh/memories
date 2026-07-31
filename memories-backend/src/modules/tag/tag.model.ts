import { Schema, model } from 'mongoose';
import type { TagRecord } from './tag.types.js';

function toTagSlug(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const TagSchema = new Schema<TagRecord>(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    slug: { type: String, required: true, unique: true, index: true, maxlength: 50 },
    color: { type: String, trim: true, maxlength: 20 },
  },
  { timestamps: true },
);

TagSchema.pre('validate', function normaliseTag() {
  this.name = this.name.trim();
  this.slug = toTagSlug(this.name);
});

export const Tag = model<TagRecord>('Tag', TagSchema);
