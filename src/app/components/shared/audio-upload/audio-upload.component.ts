import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  AudioUploadFile,
  AudioUploadProgress,
  AudioUploadResponse,
  AudioUploadStatus,
  AudioUploadValidationError,
} from '../../../core/models/audio-upload.model';
import { AudioUploadService } from '../../../services/audio-upload.service';

@Component({
  selector: 'app-audio-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-upload.component.html',
  styleUrl: './audio-upload.component.scss',
})
export class AudioUploadComponent implements OnDestroy {
  readonly label = input('Upload audio');
  readonly helperText = input('MP3, WAV or OGG up to 50 MB');
  readonly disabled = input(false);
  readonly autoUpload = input(false);

  readonly selected = output<AudioUploadFile>();
  readonly uploaded = output<AudioUploadResponse>();
  readonly removed = output<void>();
  readonly failed = output<AudioUploadValidationError>();

  private readonly uploadService = inject(AudioUploadService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private uploadSub?: Subscription;

  readonly file = signal<AudioUploadFile | null>(null);
  readonly status = signal<AudioUploadStatus>('idle');
  readonly progress = signal(0);
  readonly loaded = signal(0);
  readonly total = signal(0);
  readonly error = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly hasFile = computed(() => !!this.file());
  readonly isUploading = computed(() => this.status() === 'uploading');
  readonly canUpload = computed(
    () => this.hasFile() && !this.isUploading() && this.status() !== 'uploaded' && !this.error(),
  );
  readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'uploading':
        return `Uploading ${this.progress()}%`;
      case 'uploaded':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'selected':
        return 'Ready to upload';
      default:
        return 'Waiting for audio';
    }
  });

  private readonly maxSize = 50 * 1024 * 1024;
  private readonly allowedTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/ogg',
    'application/ogg',
  ];
  private readonly allowedExtensions = ['mp3', 'wav', 'ogg'];

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.revokePreview();
  }

  openFilePicker(): void {
    if (this.disabled() || this.isUploading()) return;
    this.fileInput()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.setFile(inputEl.files?.[0] ?? null);
    inputEl.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled() && !this.isUploading()) this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    if (this.disabled() || this.isUploading()) return;
    this.setFile(event.dataTransfer?.files?.[0] ?? null);
  }

  upload(): void {
    const selectedFile = this.file();
    if (!selectedFile || !this.canUpload()) return;

    this.uploadSub?.unsubscribe();
    this.status.set('uploading');
    this.progress.set(1);
    this.loaded.set(0);
    this.total.set(selectedFile.size);
    this.error.set(null);

    this.uploadSub = this.uploadService.uploadAudio(selectedFile.file).subscribe({
      next: state => this.applyUploadState(state),
      error: (uploadError: AudioUploadValidationError) => {
        this.status.set('error');
        this.progress.set(0);
        this.error.set(uploadError.message);
        this.failed.emit(uploadError);
      },
    });
  }

  remove(): void {
    this.uploadSub?.unsubscribe();
    this.uploadSub = undefined;
    this.revokePreview();
    this.file.set(null);
    this.status.set('idle');
    this.progress.set(0);
    this.loaded.set(0);
    this.total.set(0);
    this.error.set(null);
    this.removed.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDuration(seconds?: number): string {
    if (!seconds || Number.isNaN(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  private setFile(nextFile: File | null): void {
    if (!nextFile) return;

    const validationError = this.validateFile(nextFile);
    if (validationError) {
      this.remove();
      this.status.set('error');
      this.error.set(validationError.message);
      this.failed.emit(validationError);
      return;
    }

    this.uploadSub?.unsubscribe();
    this.revokePreview();

    const uploadFile: AudioUploadFile = {
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
      name: nextFile.name,
      size: nextFile.size,
      type: nextFile.type,
    };

    this.file.set(uploadFile);
    this.status.set('selected');
    this.progress.set(0);
    this.loaded.set(0);
    this.total.set(nextFile.size);
    this.error.set(null);
    this.selected.emit(uploadFile);
    this.loadDuration(uploadFile.previewUrl);

    if (this.autoUpload()) this.upload();
  }

  private validateFile(file: File): AudioUploadValidationError | null {
    if (!file.size) {
      return { code: 'empty_file', message: 'Please choose a valid audio file.' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!this.allowedTypes.includes(file.type) && !this.allowedExtensions.includes(extension)) {
      return { code: 'invalid_type', message: 'Only MP3, WAV and OGG audio files are supported.' };
    }

    if (file.size > this.maxSize) {
      return { code: 'file_too_large', message: 'Audio must be 50 MB or smaller.' };
    }

    return null;
  }

  private loadDuration(previewUrl: string): void {
    const audio = new Audio(previewUrl);
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => this.patchFile({ duration: audio.duration });
  }

  private applyUploadState(state: AudioUploadProgress): void {
    this.status.set(state.status);
    this.progress.set(state.progress);
    this.loaded.set(state.loaded);
    this.total.set(state.total);

    if (state.error) {
      this.error.set(state.error);
      this.failed.emit({ code: 'upload_failed', message: state.error });
    }

    if (state.response) {
      this.error.set(null);
      this.uploaded.emit(state.response);
    }
  }

  private patchFile(patch: Partial<AudioUploadFile>): void {
    const current = this.file();
    if (current) this.file.set({ ...current, ...patch });
  }

  private revokePreview(): void {
    const previewUrl = this.file()?.previewUrl;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }
}
