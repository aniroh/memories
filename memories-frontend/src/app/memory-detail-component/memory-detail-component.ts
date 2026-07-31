import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MemoriesApiService } from '../core/api/memories-api.service';
import { MediaImageComponent } from '../core/media/media-image';
import { Memory, MemoryBlock } from '../models/memory';

@Component({
  selector: 'app-memory-detail-component',
  standalone: true,
  imports: [RouterLink, DatePipe, MediaImageComponent],
  templateUrl: './memory-detail-component.html',
  styleUrl: './memory-detail-component.scss',
})
export class MemoryDetailComponent {
  private readonly api = inject(MemoriesApiService);
  private readonly router = inject(Router);

  /** Bound from the route param `:id` via withComponentInputBinding(). */
  readonly id = input<string>('');

  readonly memory = signal<Memory | null>(null);
  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly deleting = signal(false);

  readonly blocks = computed(() =>
    [...(this.memory()?.blocks ?? [])].sort((a, b) => a.position - b.position),
  );

  private loadedId = '';

  constructor() {
    effect(() => {
      const routeId = this.id();
      if (routeId && routeId !== this.loadedId) {
        this.loadedId = routeId;
        void this.load(routeId);
      }
    });
  }

  text(block: MemoryBlock): string {
    const value = block.content?.['text'];
    return typeof value === 'string' ? value : '';
  }

  mediaId(block: MemoryBlock): string | undefined {
    const value = block.content?.['mediaId'];
    return typeof value === 'string' ? value : undefined;
  }

  mediaIds(block: MemoryBlock): string[] {
    const value = block.content?.['mediaIds'];
    return Array.isArray(value) ? (value.filter((id) => typeof id === 'string') as string[]) : [];
  }

  private async load(id: string): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      this.memory.set(await this.api.getMemory(id));
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  async remove(): Promise<void> {
    const current = this.memory();
    if (!current || this.deleting()) return;
    if (!confirm('Delete this memory? Your photos stay in your gallery.')) return;
    this.deleting.set(true);
    try {
      await this.api.deleteMemory(current._id);
      await this.router.navigate(['/']);
    } catch {
      this.deleting.set(false);
      alert('Could not delete this memory. Please try again.');
    }
  }
}
