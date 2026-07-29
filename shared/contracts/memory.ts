/**
 * Framework-neutral contract for the memory editor and public API.
 * Keep this free of Mongoose and Angular imports so it can later become a
 * small shared workspace package without changing its public shape.
 */
export type MemoryBlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'video'
  | 'map'
  | 'quote'
  | 'divider';

export interface MemoryBlockContract {
  id: string;
  type: MemoryBlockType;
  position: number;
  caption?: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MemoryContract {
  id: string;
  title: string;
  blocks: MemoryBlockContract[];
  coverMediaId?: string;
  happenedAt?: string;
  tagIds: string[];
  moods: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}
