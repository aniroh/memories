import { HttpClient, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { filter, firstValueFrom, map } from 'rxjs';
import { API_BASE_URL } from './api-base-url.token';
import {
  CompleteResponse,
  CompletedUpload,
  DraftMemory,
  Media,
  Memory,
  MemoryBlock,
  PresignFileRequest,
  PresignResponse,
} from '../../models/memory';

const MAX_CONCURRENT_UPLOADS = 3;

export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percent: number;
  done: boolean;
}

@Injectable({ providedIn: 'root' })
export class MemoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly readUrlCache = new Map<string, string>();

  // --- Memories ---------------------------------------------------------

  listMemories(): Promise<Memory[]> {
    return firstValueFrom(
      this.http.get<{ memories: Memory[] }>(`${this.baseUrl}/memories`).pipe(map((r) => r.memories)),
    );
  }

  getMemory(id: string): Promise<Memory> {
    return firstValueFrom(
      this.http.get<{ memory: Memory }>(`${this.baseUrl}/memories/${id}`).pipe(map((r) => r.memory)),
    );
  }

  deleteMemory(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/memories/${id}`));
  }

  // --- Drafts -----------------------------------------------------------

  patchDraft(id: string, update: Partial<DraftMemory>): Promise<DraftMemory> {
    return firstValueFrom(
      this.http
        .patch<{ draft: DraftMemory }>(`${this.baseUrl}/drafts/${id}`, update)
        .pipe(map((r) => r.draft)),
    );
  }

  approveDraft(id: string, title: string): Promise<Memory> {
    return firstValueFrom(
      this.http
        .post<{ memory: Memory }>(`${this.baseUrl}/drafts/${id}/approve`, { title })
        .pipe(map((r) => r.memory)),
    );
  }

  deleteDraft(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.baseUrl}/drafts/${id}`));
  }

  // --- Media ------------------------------------------------------------

  listMedia(): Promise<Media[]> {
    return firstValueFrom(
      this.http.get<{ media: Media[] }>(`${this.baseUrl}/media`).pipe(map((r) => r.media)),
    );
  }

  async getReadUrl(mediaId: string): Promise<string> {
    const cached = this.readUrlCache.get(mediaId);
    if (cached) return cached;

    const { url } = await firstValueFrom(
      this.http.get<{ url: string }>(`${this.baseUrl}/uploads/media/${mediaId}/read-url`),
    );
    this.readUrlCache.set(mediaId, url);
    return url;
  }

  // --- Upload flow ------------------------------------------------------

  private presign(files: PresignFileRequest[]): Promise<PresignResponse> {
    return firstValueFrom(
      this.http.post<PresignResponse>(`${this.baseUrl}/uploads/presign`, { files }),
    );
  }

  private complete(batchId: string, uploads: CompletedUpload[]): Promise<CompleteResponse> {
    return firstValueFrom(
      this.http.post<CompleteResponse>(`${this.baseUrl}/uploads/complete`, { batchId, uploads }),
    );
  }

  /**
   * Uploads files directly to R2 (max 3 concurrent), reporting per-file
   * progress, then confirms the batch and returns the created draft + media.
   */
  async uploadBatch(
    files: File[],
    onProgress: (progress: UploadProgress[]) => void,
  ): Promise<CompleteResponse> {
    const fileRequests: PresignFileRequest[] = files.map((file) => ({
      fileName: file.name,
      contentType: file.type,
      sizeBytes: file.size,
    }));

    const presigned = await this.presign(fileRequests);

    const progress: UploadProgress[] = files.map((file) => ({
      fileName: file.name,
      loaded: 0,
      total: file.size,
      percent: 0,
      done: false,
    }));
    onProgress([...progress]);

    const completed: CompletedUpload[] = new Array(files.length);

    const uploadOne = async (index: number): Promise<void> => {
      const file = files[index];
      const target = presigned.uploads[index];

      await firstValueFrom(
        this.http
          .request(
            new HttpRequest('PUT', target.uploadUrl, file, {
              reportProgress: true,
              headers: new HttpHeaders({ 'Content-Type': file.type }),
            }),
          )
          .pipe(
            map((event) => {
              if (event.type === HttpEventType.UploadProgress) {
                progress[index] = {
                  fileName: file.name,
                  loaded: event.loaded,
                  total: event.total ?? file.size,
                  percent: Math.round((event.loaded / (event.total ?? file.size)) * 100),
                  done: false,
                };
                onProgress([...progress]);
              }
              return event;
            }),
            filter((event) => event.type === HttpEventType.Response),
          ),
      );

      progress[index] = { fileName: file.name, loaded: file.size, total: file.size, percent: 100, done: true };
      onProgress([...progress]);

      completed[index] = {
        key: target.key,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      };
    };

    // Simple concurrency pool.
    let cursor = 0;
    const workers = Array.from({ length: Math.min(MAX_CONCURRENT_UPLOADS, files.length) }, async () => {
      while (cursor < files.length) {
        const index = cursor++;
        await uploadOne(index);
      }
    });
    await Promise.all(workers);

    return this.complete(presigned.batchId, completed);
  }

  /**
   * Publishes an uploaded batch as a Memory: sets the draft's blocks/title/date,
   * then approves it into a final Memory.
   */
  async publishFromDraft(
    draftId: string,
    details: { title: string; story?: string; happenedAt?: string; mediaIds: string[] },
  ): Promise<Memory> {
    const blocks: MemoryBlock[] = [];
    let position = 0;

    if (details.story?.trim()) {
      blocks.push({ type: 'text', position: position++, content: { text: details.story.trim() } });
    }
    blocks.push({ type: 'gallery', position: position++, content: { mediaIds: details.mediaIds } });

    await this.patchDraft(draftId, {
      title: details.title,
      happenedAt: details.happenedAt || undefined,
      blocks,
    } as Partial<DraftMemory>);

    return this.approveDraft(draftId, details.title);
  }
}
