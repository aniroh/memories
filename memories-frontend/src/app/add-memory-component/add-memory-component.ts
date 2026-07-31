import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MemoriesApiService, UploadProgress } from '../core/api/memories-api.service';

interface PickedFile {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-add-memory',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-memory-component.html',
  styleUrl: './add-memory-component.scss',
})
export class AddMemoryComponent {
  private readonly api = inject(MemoriesApiService);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly story = signal('');
  readonly happenedAt = signal('');

  readonly files = signal<PickedFile[]>([]);
  readonly dragging = signal(false);
  readonly progress = signal<UploadProgress[]>([]);
  readonly saving = signal(false);
  readonly statusText = signal('');
  readonly error = signal('');

  readonly canSave = computed(
    () => !this.saving() && this.files().length > 0 && this.title().trim().length > 0,
  );

  readonly overallPercent = computed(() => {
    const items = this.progress();
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + item.percent, 0);
    return Math.round(total / items.length);
  });

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  onDragLeave(): void {
    this.dragging.set(false);
  }

  removeFile(index: number): void {
    const current = this.files();
    URL.revokeObjectURL(current[index].previewUrl);
    this.files.set(current.filter((_, i) => i !== index));
  }

  private addFiles(incoming: File[]): void {
    const accepted = incoming.filter(
      (file) => file.type.startsWith('image/') || file.type.startsWith('video/'),
    );
    const remainingSlots = 20 - this.files().length;
    const picked = accepted.slice(0, Math.max(0, remainingSlots)).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    this.files.set([...this.files(), ...picked]);
    this.error.set('');
  }

  isVideo(file: File): boolean {
    return file.type.startsWith('video/');
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving.set(true);
    this.error.set('');

    try {
      this.statusText.set('Uploading your media…');
      const result = await this.api.uploadBatch(
        this.files().map((item) => item.file),
        (progress) => this.progress.set(progress),
      );

      this.statusText.set('Creating the memory…');
      const memory = await this.api.publishFromDraft(result.draft._id, {
        title: this.title().trim(),
        story: this.story(),
        happenedAt: this.happenedAt(),
        mediaIds: result.media.map((media) => media._id),
      });

      this.files().forEach((item) => URL.revokeObjectURL(item.previewUrl));
      await this.router.navigate(['/memory', memory._id]);
    } catch (error) {
      console.error(error);
      this.error.set('Something went wrong while saving. Please try again.');
      this.saving.set(false);
    }
  }
}
