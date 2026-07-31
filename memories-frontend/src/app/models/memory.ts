export type MemoryBlockType =
  | 'text'
  | 'heading'
  | 'image'
  | 'gallery'
  | 'video'
  | 'map'
  | 'quote'
  | 'divider';

export interface MemoryBlock {
  id: string;
  type: MemoryBlockType;
  position: number;
  caption?: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface Memory {
  id: string;
  title: string;
  blocks: MemoryBlock[];
  coverMediaId?: string;
  happenedAt?: string;
  tagIds: string[];
  moods: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}
