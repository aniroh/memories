export const MAX_FILES_PER_BATCH = 20;
export const MAX_BATCH_SIZE_BYTES = 500 * 1024 * 1024;
export const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024;
export const MAX_AUDIO_SIZE_BYTES = 100 * 1024 * 1024;
export const PRESIGNED_UPLOAD_EXPIRY_SECONDS = 15 * 60;
export const PRESIGNED_READ_EXPIRY_SECONDS = 60 * 60;

const supportedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
]);

export function getMediaType(contentType: string): 'image' | 'video' | 'audio' {
  if (!supportedMimeTypes.has(contentType)) {
    throw new Error(`Unsupported media type: ${contentType}`);
  }

  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return 'audio';
}

export function getMaximumFileSize(contentType: string): number {
  const mediaType = getMediaType(contentType);

  if (mediaType === 'image') return MAX_IMAGE_SIZE_BYTES;
  if (mediaType === 'video') return MAX_VIDEO_SIZE_BYTES;
  return MAX_AUDIO_SIZE_BYTES;
}
