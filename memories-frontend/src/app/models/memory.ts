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
  type: MemoryBlockType;
  position: number;
  caption?: string;
  content: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MemoryLocation {
  latitude?: number;
  longitude?: number;
  placeName?: string;
  address?: string;
}

export type MediaType = 'image' | 'video' | 'audio';

export interface Media {
  _id: string;
  key: string;
  type: MediaType;
  metadata: {
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    [key: string]: unknown;
  };
  previewKey?: string;
  thumbnailKey?: string;
  processingState: string;
  takenAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  _id: string;
  title: string;
  blocks: MemoryBlock[];
  coverMedia?: string;
  happenedAt?: string;
  location?: MemoryLocation;
  tags: string[];
  moods: string[];
  favorite: boolean;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DraftStatus =
  | 'in_progress'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'discarded';

export interface DraftMemory {
  _id: string;
  source: 'manual' | 'upload';
  status: DraftStatus;
  title?: string;
  blocks: MemoryBlock[];
  candidateMedia: string[];
  coverMedia?: string;
  happenedAt?: string;
  moods: string[];
  resolvedMemory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresignFileRequest {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface PresignUpload {
  key: string;
  uploadUrl: string;
  fileName: string;
  contentType: string;
}

export interface PresignResponse {
  batchId: string;
  expiresInSeconds: number;
  uploads: PresignUpload[];
}

export interface CompletedUpload extends PresignFileRequest {
  key: string;
}

export interface CompleteResponse {
  draft: DraftMemory;
  media: Media[];
}

/** Best-effort cover image for a memory: explicit cover, else first photo. */
export function getCoverMediaId(memory: Memory): string | undefined {
  if (memory.coverMedia) return memory.coverMedia;
  const sorted = [...(memory.blocks ?? [])].sort((a, b) => a.position - b.position);
  for (const block of sorted) {
    if (block.type === 'image' && typeof block.content?.['mediaId'] === 'string') {
      return block.content['mediaId'] as string;
    }
    if (block.type === 'gallery') {
      const ids = block.content?.['mediaIds'];
      if (Array.isArray(ids) && ids.length > 0 && typeof ids[0] === 'string') {
        return ids[0] as string;
      }
    }
  }
  return undefined;
}

/** Count of photos/videos referenced by a memory's blocks. */
export function getMemoryMediaCount(memory: Memory): number {
  let count = 0;
  for (const block of memory.blocks ?? []) {
    if (block.type === 'image' && block.content?.['mediaId']) count += 1;
    if (block.type === 'gallery' && Array.isArray(block.content?.['mediaIds'])) {
      count += (block.content['mediaIds'] as unknown[]).length;
    }
  }
  return count;
}
