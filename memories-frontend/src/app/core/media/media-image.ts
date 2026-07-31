import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { MemoriesApiService } from '../api/memories-api.service';

/**
 * Loads a private R2 media item through a short-lived read URL and displays it.
 * Works for images and (best-effort) video.
 */
@Component({
  selector: 'app-media-image',
  standalone: true,
  template: `
    <div class="media-frame" [style.aspect-ratio]="ratio()">
      @if (url()) {
        @if (isVideo()) {
          <video [src]="url()!" controls playsinline></video>
        } @else {
          <img [src]="url()!" [alt]="alt()" loading="lazy" />
        }
      } @else if (failed()) {
        <div class="media-fallback">image unavailable</div>
      } @else {
        <div class="media-loading"></div>
      }
    </div>
  `,
  styles: [
    `
      .media-frame {
        position: relative;
        width: 100%;
        overflow: hidden;
        border-radius: inherit;
        background: var(--warm-surface-alt);
      }
      img,
      video {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .media-loading {
        position: absolute;
        inset: 0;
        background: linear-gradient(100deg, #f4e7d6 30%, #fbf1e4 50%, #f4e7d6 70%);
        background-size: 200% 100%;
        animation: shimmer 1.4s infinite;
      }
      .media-fallback {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: var(--warm-muted);
        font-size: 0.85rem;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class MediaImageComponent {
  private readonly api = inject(MemoriesApiService);

  readonly mediaId = input.required<string>();
  readonly type = input<string>('image');
  readonly alt = input<string>('Memory');
  readonly ratio = input<string>('1 / 1');

  readonly url = signal<string | null>(null);
  readonly failed = signal(false);
  readonly isVideo = computed(() => this.type() === 'video');

  private loadedFor = '';

  constructor() {
    effect(() => {
      const id = this.mediaId();
      if (!id || id === this.loadedFor) return;
      this.loadedFor = id;
      void this.load(id);
    });
  }

  private async load(id: string): Promise<void> {
    this.url.set(null);
    this.failed.set(false);
    try {
      this.url.set(await this.api.getReadUrl(id));
    } catch {
      this.failed.set(true);
    }
  }
}
