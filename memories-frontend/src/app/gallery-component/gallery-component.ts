import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MemoriesApiService } from '../core/api/memories-api.service';
import { MediaImageComponent } from '../core/media/media-image';
import { Media } from '../models/memory';

@Component({
  selector: 'app-gallery-component',
  standalone: true,
  imports: [RouterLink, MediaImageComponent],
  templateUrl: './gallery-component.html',
  styleUrl: './gallery-component.scss',
})
export class GalleryComponent {
  private readonly api = inject(MemoriesApiService);

  readonly media = signal<Media[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.media.set(await this.api.listMedia());
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
