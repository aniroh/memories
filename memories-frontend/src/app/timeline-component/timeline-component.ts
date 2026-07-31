import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemoriesApiService } from '../core/api/memories-api.service';
import { MediaImageComponent } from '../core/media/media-image';
import { getCoverMediaId, getMemoryMediaCount, Memory } from '../models/memory';

@Component({
  selector: 'app-timeline-component',
  standalone: true,
  imports: [RouterLink, DatePipe, MediaImageComponent],
  templateUrl: './timeline-component.html',
  styleUrl: './timeline-component.scss',
})
export class TimelineComponent {
  private readonly api = inject(MemoriesApiService);

  readonly memories = signal<Memory[]>([]);
  readonly loading = signal(true);
  readonly failed = signal(false);

  readonly cover = getCoverMediaId;
  readonly mediaCount = getMemoryMediaCount;

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const memories = await this.api.listMemories();
      memories.sort((a, b) => this.when(b) - this.when(a));
      this.memories.set(memories);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  private when(memory: Memory): number {
    return new Date(memory.happenedAt || memory.createdAt).getTime();
  }
}
