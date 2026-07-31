import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Router } from 'express';
import { createR2Client, getR2BucketName } from '../../config/r2.js';
import { DraftMemory } from '../memory/draft-memory.model.js';
import { Memory } from '../memory/memory.model.js';
import { ApiError, asyncRoute } from '../../utils/api-error.js';
import { requireObjectId } from '../../utils/validation.js';
import { Media } from './media.model.js';

export const mediaRouter = Router();

mediaRouter.get(
  '/',
  asyncRoute(async (_request, response) => {
    const media = await Media.find().sort({ createdAt: -1 }).limit(100);
    response.json({ media });
  }),
);

mediaRouter.delete(
  '/:id',
  asyncRoute(async (request, response) => {
    const mediaId = requireObjectId(request.params.id, 'media id');
    const media = await Media.findById(mediaId);
    if (!media) throw new ApiError(404, 'Media not found.');

    const mediaIdForms = [media._id, media._id.toString()];
    const referenceQuery = {
      $or: [
        { coverMedia: { $in: mediaIdForms } },
        { candidateMedia: { $in: mediaIdForms } },
        { 'blocks.content.mediaId': { $in: mediaIdForms } },
        { 'blocks.content.mediaIds': { $in: mediaIdForms } },
      ],
    };
    const [memoryReference, draftReference] = await Promise.all([
      Memory.exists(referenceQuery),
      DraftMemory.exists(referenceQuery),
    ]);

    if (memoryReference || draftReference) {
      throw new ApiError(409, 'Remove this media from every memory and draft before deleting it.');
    }

    const keys = [media.key, media.previewKey, media.thumbnailKey].filter(
      (key): key is string => Boolean(key),
    );
    await createR2Client().send(
      new DeleteObjectsCommand({
        Bucket: getR2BucketName(),
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    await media.deleteOne();

    response.status(204).send();
  }),
);
