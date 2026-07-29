export const mediaTypes = ['image', 'video', 'audio'] as const;
export type MediaType = (typeof mediaTypes)[number];

export const mediaProcessingStates = ['pending', 'processing', 'ready', 'failed'] as const;
export type MediaProcessingState = (typeof mediaProcessingStates)[number];

export interface MediaLocation {
  latitude: number;
  longitude: number;
  placeName?: string;
}

export interface MediaMetadata {
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  cameraMake?: string;
  cameraModel?: string;
  [key: string]: unknown;
}

export interface MediaRecord {
  key: string;
  previewKey?: string;
  thumbnailKey?: string;
  type: MediaType;
  metadata: MediaMetadata;
  takenAt?: Date;
  location?: MediaLocation;
  hash?: string;
  processingState: MediaProcessingState;
}
