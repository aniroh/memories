import type { Types } from 'mongoose';

export const memoryBlockTypes = [
  'text',
  'heading',
  'image',
  'gallery',
  'video',
  'map',
  'quote',
  'divider',
] as const;

export type MemoryBlockType = (typeof memoryBlockTypes)[number];

export interface MemoryLocation {
  latitude?: number;
  longitude?: number;
  placeName?: string;
  address?: string;
}

/**
 * `content` is intentionally polymorphic. The API layer will validate each
 * block type, while the database remains open to new story moments (such as
 * weather, Spotify, or voice notes) without a migration.
 */
export interface MemoryBlock {
  type: MemoryBlockType;
  position: number;
  caption?: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MemoryRecord {
  title: string;
  blocks: MemoryBlock[];
  coverMedia?: Types.ObjectId;
  happenedAt?: Date;
  location?: MemoryLocation;
  tags: Types.ObjectId[];
  moods: string[];
  favorite: boolean;
  publishedAt?: Date;
}

export const draftSources = ['manual', 'upload'] as const;
export type DraftSource = (typeof draftSources)[number];

export const draftStatuses = ['in_progress', 'pending_review', 'approved', 'rejected', 'discarded'] as const;
export type DraftStatus = (typeof draftStatuses)[number];

export interface DraftSuggestion {
  title?: string;
  summary?: string;
  moods?: string[];
  confidence?: number;
}

export interface DraftMemoryRecord {
  source: DraftSource;
  status: DraftStatus;
  title?: string;
  blocks: MemoryBlock[];
  candidateMedia: Types.ObjectId[];
  coverMedia?: Types.ObjectId;
  happenedAt?: Date;
  location?: MemoryLocation;
  tags: Types.ObjectId[];
  moods: string[];
  suggestion?: DraftSuggestion;
  resolvedMemory?: Types.ObjectId;
}
