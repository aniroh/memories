import { GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { createR2Client, getR2BucketName } from '../../config/r2.js';
import { DraftMemory } from '../memory/draft-memory.model.js';
import { Media } from '../media/media.model.js';
import type { MediaType } from '../media/media.types.js';
import { ApiError, asyncRoute } from '../../utils/api-error.js';
import { requireArray, requireNonEmptyString, requireObject } from '../../utils/validation.js';
import {
  getMaximumFileSize,
  getMediaType,
  MAX_BATCH_SIZE_BYTES,
  MAX_FILES_PER_BATCH,
  PRESIGNED_READ_EXPIRY_SECONDS,
  PRESIGNED_UPLOAD_EXPIRY_SECONDS,
} from './upload.constants.js';

interface UploadRequestFile {
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

interface CompletedUpload extends UploadRequestFile {
  key: string;
}

function safeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-100) || 'upload';
}

function createObjectKey(batchId: string, fileName: string): string {
  return `media/${batchId}/${randomUUID()}-${safeFileName(fileName)}`;
}

function parseUploadFile(value: unknown): UploadRequestFile {
  const file = requireObject(value, 'files[]');
  const fileName = requireNonEmptyString(file.fileName, 'files[].fileName', 255);
  const contentType = requireNonEmptyString(file.contentType, 'files[].contentType', 100).toLowerCase();
  const sizeBytes = file.sizeBytes;

  if (typeof sizeBytes !== 'number' || !Number.isSafeInteger(sizeBytes) || sizeBytes < 1) {
    throw new ApiError(400, 'files[].sizeBytes must be a positive integer.');
  }

  try {
    const maximumSize = getMaximumFileSize(contentType);
    if (sizeBytes > maximumSize) {
      throw new ApiError(400, `${fileName} exceeds this file type's upload limit.`);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, `Unsupported file type for ${fileName}.`);
  }

  return { fileName, contentType, sizeBytes };
}

function parseUploadFiles(value: unknown): UploadRequestFile[] {
  const files = requireArray(value, 'files', MAX_FILES_PER_BATCH).map(parseUploadFile);

  if (files.length === 0) {
    throw new ApiError(400, 'Select at least one file.');
  }

  const batchSize = files.reduce((total, file) => total + file.sizeBytes, 0);
  if (batchSize > MAX_BATCH_SIZE_BYTES) {
    throw new ApiError(400, 'A batch can be at most 500 MB. Create another batch for the remaining files.');
  }

  return files;
}

function parseCompletedUpload(value: unknown, batchId: string): CompletedUpload {
  const upload = requireObject(value, 'uploads[]');
  const key = requireNonEmptyString(upload.key, 'uploads[].key', 1_024);
  const parsedFile = parseUploadFile(upload);

  if (!key.startsWith(`media/${batchId}/`)) {
    throw new ApiError(400, 'An uploaded file does not belong to this upload batch.');
  }

  return { key, ...parsedFile };
}

export const uploadRouter = Router();

/** Creates short-lived PUT URLs; file bytes never pass through Render. */
uploadRouter.post(
  '/presign',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const files = parseUploadFiles(body.files);
    const batchId = randomUUID();
    const r2Client = createR2Client();
    const bucketName = getR2BucketName();

    const uploads = await Promise.all(
      files.map(async (file) => {
        const key = createObjectKey(batchId, file.fileName);
        const uploadUrl = await getSignedUrl(
          r2Client,
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            ContentType: file.contentType,
          }),
          { expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS },
        );

        return { key, uploadUrl, fileName: file.fileName, contentType: file.contentType };
      }),
    );

    response.status(201).json({
      batchId,
      expiresInSeconds: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
      uploads,
    });
  }),
);

/** Confirms R2 objects, creates Media documents, and places them in one draft. */
uploadRouter.post(
  '/complete',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const batchId = requireNonEmptyString(body.batchId, 'batchId', 100);
    const uploads = requireArray(body.uploads, 'uploads', MAX_FILES_PER_BATCH).map((upload) =>
      parseCompletedUpload(upload, batchId),
    );

    if (uploads.length === 0) {
      throw new ApiError(400, 'uploads must contain at least one completed file.');
    }

    const r2Client = createR2Client();
    const bucketName = getR2BucketName();
    const media = await Promise.all(
      uploads.map(async (upload) => {
        const head = await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: upload.key }));
        const contentLength = head.ContentLength ?? 0;
        const contentType = head.ContentType?.toLowerCase() ?? upload.contentType;

        if (contentLength < 1 || contentLength > getMaximumFileSize(contentType)) {
          throw new ApiError(400, `${upload.fileName} is missing or exceeds the permitted upload size.`);
        }

        const type: MediaType = getMediaType(contentType);
        const existingMedia = await Media.findOne({ key: upload.key });
        if (existingMedia) return existingMedia;

        return Media.create({
          key: upload.key,
          type,
          metadata: {
            fileName: upload.fileName,
            mimeType: contentType,
            sizeBytes: contentLength,
            etag: head.ETag,
          },
          processingState: 'pending',
        });
      }),
    );

    const mediaIds = media.map((item) => item._id);
    const draft = await DraftMemory.create({
      source: 'upload',
      status: 'pending_review',
      candidateMedia: mediaIds,
      blocks: [
        {
          type: 'gallery',
          position: 0,
          content: { mediaIds },
        },
      ],
    });

    response.status(201).json({ draft, media });
  }),
);

/** A temporary read URL is used until an R2 custom media domain is configured. */
uploadRouter.get(
  '/media/:id/read-url',
  asyncRoute(async (request, response) => {
    const media = await Media.findById(request.params.id);
    if (!media) throw new ApiError(404, 'Media not found.');

    const readUrl = await getSignedUrl(
      createR2Client(),
      new GetObjectCommand({ Bucket: getR2BucketName(), Key: media.key }),
      { expiresIn: PRESIGNED_READ_EXPIRY_SECONDS },
    );

    response.json({ url: readUrl, expiresInSeconds: PRESIGNED_READ_EXPIRY_SECONDS });
  }),
);
