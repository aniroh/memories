import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemoriesApiService } from '../core/api/memories-api.service';
import { MediaImageComponent } from '../core/media/media-image';
import { getCoverMediaId, getMemoryMediaCount, Memory } from '../models/memory';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [RouterLink, DatePipe, MediaImageComponent],
  templateUrl: './home-component.html',
  styleUrl: './home-component.scss',
})
export class HomeComponent {
  private readonly api = inject(MemoriesApiService);

  readonly memories = signal<Memory[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly featured = computed(() => this.memories()[0]);
  readonly rest = computed(() => this.memories().slice(1));

  readonly cover = getCoverMediaId;
  readonly mediaCount = getMemoryMediaCount;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.memories.set(await this.api.listMemories());
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
