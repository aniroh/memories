import { Router } from 'express';
import { startSession } from 'mongoose';
import { ApiError, asyncRoute } from '../../utils/api-error.js';
import { requireObject, requireObjectId } from '../../utils/validation.js';
import { DraftMemory } from './draft-memory.model.js';
import { Memory } from './memory.model.js';
import type { DraftMemoryRecord, MemoryRecord } from './memory.types.js';

const memoryFields = [
  'title',
  'blocks',
  'coverMedia',
  'happenedAt',
  'location',
  'tags',
  'moods',
  'favorite',
] as const;

const draftFields = [
  'title',
  'blocks',
  'candidateMedia',
  'coverMedia',
  'happenedAt',
  'location',
  'tags',
  'moods',
  'suggestion',
  'status',
] as const;

function pickEditableFields<T extends readonly string[]>(body: Record<string, unknown>, fields: T): Partial<Record<T[number], unknown>> {
  return Object.fromEntries(
    fields.flatMap((field) => (body[field] === undefined ? [] : [[field, body[field]]])),
  ) as Partial<Record<T[number], unknown>>;
}

function ensurePublishedTitle(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(422, 'A draft needs a title before it can become a memory.');
  }

  return value.trim();
}

export const memoryRouter = Router();
export const draftRouter = Router();

memoryRouter.get(
  '/',
  asyncRoute(async (_request, response) => {
    const memories = await Memory.find().sort({ happenedAt: -1, publishedAt: -1 }).limit(100);
    response.json({ memories });
  }),
);

memoryRouter.get(
  '/:id',
  asyncRoute(async (request, response) => {
    const memory = await Memory.findById(requireObjectId(request.params.id, 'memory id'));
    if (!memory) throw new ApiError(404, 'Memory not found.');
    response.json({ memory });
  }),
);

memoryRouter.post(
  '/',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const memory = await Memory.create(pickEditableFields(body, memoryFields) as Partial<MemoryRecord>);
    response.status(201).json({ memory });
  }),
);

memoryRouter.patch(
  '/:id',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const update = pickEditableFields(body, memoryFields);
    const memory = await Memory.findByIdAndUpdate(
      requireObjectId(request.params.id, 'memory id'),
      update,
      { new: true, runValidators: true },
    );
    if (!memory) throw new ApiError(404, 'Memory not found.');
    response.json({ memory });
  }),
);

memoryRouter.delete(
  '/:id',
  asyncRoute(async (request, response) => {
    const memory = await Memory.findByIdAndDelete(requireObjectId(request.params.id, 'memory id'));
    if (!memory) throw new ApiError(404, 'Memory not found.');
    response.status(204).send();
  }),
);

draftRouter.get(
  '/',
  asyncRoute(async (_request, response) => {
    const drafts = await DraftMemory.find().sort({ updatedAt: -1 }).limit(100);
    response.json({ drafts });
  }),
);

draftRouter.get(
  '/:id',
  asyncRoute(async (request, response) => {
    const draft = await DraftMemory.findById(requireObjectId(request.params.id, 'draft id'));
    if (!draft) throw new ApiError(404, 'Draft not found.');
    response.json({ draft });
  }),
);

draftRouter.post(
  '/',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const draft = await DraftMemory.create({
      source: body.source ?? 'manual',
      ...pickEditableFields(body, draftFields),
    } as Partial<DraftMemoryRecord>);
    response.status(201).json({ draft });
  }),
);

draftRouter.patch(
  '/:id',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const update = pickEditableFields(body, draftFields);
    const draft = await DraftMemory.findByIdAndUpdate(
      requireObjectId(request.params.id, 'draft id'),
      update,
      { new: true, runValidators: true },
    );
    if (!draft) throw new ApiError(404, 'Draft not found.');
    response.json({ draft });
  }),
);

draftRouter.post(
  '/:id/approve',
  asyncRoute(async (request, response) => {
    const body = requireObject(request.body, 'request body');
    const draftId = requireObjectId(request.params.id, 'draft id');
    const session = await startSession();
    let memoryId: string | undefined;

    try {
      await session.withTransaction(async () => {
        const draft = await DraftMemory.findById(draftId).session(session);
        if (!draft) throw new ApiError(404, 'Draft not found.');
        if (draft.status === 'approved') throw new ApiError(409, 'This draft is already approved.');

        const title = ensurePublishedTitle(body.title ?? draft.title);
        const [memory] = await Memory.create(
          [
            {
              title,
              blocks: draft.blocks,
              coverMedia: draft.coverMedia,
              happenedAt: draft.happenedAt,
              location: draft.location,
              tags: draft.tags,
              moods: draft.moods,
              favorite: false,
            },
          ],
          { session },
        );

        draft.status = 'approved';
        draft.resolvedMemory = memory._id;
        if (!draft.title) draft.title = title;
        await draft.save({ session });
        memoryId = memory._id.toString();
      });
    } finally {
      await session.endSession();
    }

    const memory = await Memory.findById(memoryId);
    const draft = await DraftMemory.findById(draftId);
    response.status(201).json({ memory, draft });
  }),
);

draftRouter.delete(
  '/:id',
  asyncRoute(async (request, response) => {
    const draft = await DraftMemory.findByIdAndDelete(requireObjectId(request.params.id, 'draft id'));
    if (!draft) throw new ApiError(404, 'Draft not found.');
    response.status(204).send();
  }),
);
