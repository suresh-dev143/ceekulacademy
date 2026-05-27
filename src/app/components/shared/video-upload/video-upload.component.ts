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
  VideoUploadFile,
  VideoUploadProgress,
  VideoUploadResponse,
  VideoUploadStatus,
  VideoUploadValidationError,
} from '../../../core/models/video-upload.model';
import { VideoUploadService } from '../../../services/video-upload.service';

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-upload.component.html',
  styleUrl: './video-upload.component.scss',
})
export class VideoUploadComponent implements OnDestroy {
  readonly label = input('Upload video');
  readonly helperText = input('MP4, MOV or WebM up to 500 MB');
  readonly disabled = input(false);
  readonly autoUpload = input(false);
  readonly chunkUploadReady = input(true);

  readonly selected = output<VideoUploadFile>();
  readonly uploaded = output<VideoUploadResponse>();
  readonly canceled = output<void>();
  readonly removed = output<void>();
  readonly failed = output<VideoUploadValidationError>();

  private readonly uploadService = inject(VideoUploadService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private uploadSub?: Subscription;

  readonly file = signal<VideoUploadFile | null>(null);
  readonly status = signal<VideoUploadStatus>('idle');
  readonly progress = signal(0);
  readonly loaded = signal(0);
  readonly total = signal(0);
  readonly error = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly isUploading = computed(() => this.status() === 'uploading');
  readonly isProcessing = computed(() => this.status() === 'processing');
  readonly hasFile = computed(() => !!this.file());
  readonly canUpload = computed(
    () =>
      this.hasFile() &&
      !this.isUploading() &&
      !this.isProcessing() &&
      this.status() !== 'success' &&
      !this.error(),
  );
  readonly canRetry = computed(() => this.hasFile() && this.status() === 'error');
  readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'uploading':
        return `Uploading ${this.progress()}%`;
      case 'processing':
        return 'Processing video';
      case 'success':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      case 'canceled':
        return 'Upload canceled';
      case 'selected':
        return 'Ready to upload';
      default:
        return 'Waiting for video';
    }
  });

  private readonly maxSize = 500 * 1024 * 1024;
  private readonly allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
  private readonly allowedExtensions = ['mp4', 'mov', 'webm'];

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
    this.revokeObjectUrls();
  }

  openFilePicker(): void {
    if (this.disabled() || this.isUploading() || this.isProcessing()) return;
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
    if (!this.disabled() && !this.isUploading() && !this.isProcessing()) this.isDragOver.set(true);
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

    if (this.disabled() || this.isUploading() || this.isProcessing()) return;
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

    this.uploadSub = this.uploadService
      .uploadVideo(selectedFile.file, { chunkUploadReady: this.chunkUploadReady() })
      .subscribe({
        next: state => this.applyUploadState(state),
        error: (uploadError: VideoUploadValidationError) => {
          this.status.set('error');
          this.progress.set(0);
          this.error.set(uploadError.message);
          this.failed.emit(uploadError);
        },
      });
  }

  cancelUpload(): void {
    if (!this.isUploading() && !this.isProcessing()) return;
    this.uploadSub?.unsubscribe();
    this.uploadSub = undefined;
    this.status.set('canceled');
    this.progress.set(0);
    this.loaded.set(0);
    this.canceled.emit();
  }

  retry(): void {
    if (!this.canRetry()) return;
    this.error.set(null);
    this.status.set('selected');
    this.upload();
  }

  remove(): void {
    this.uploadSub?.unsubscribe();
    this.uploadSub = undefined;
    this.revokeObjectUrls();
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
    this.revokeObjectUrls();

    const uploadFile: VideoUploadFile = {
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
    this.generateThumbnail(uploadFile);

    if (this.autoUpload()) this.upload();
  }

  private validateFile(file: File): VideoUploadValidationError | null {
    if (!file.size) {
      return { code: 'empty_file', message: 'Please choose a valid video file.' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!this.allowedTypes.includes(file.type) && !this.allowedExtensions.includes(extension)) {
      return { code: 'invalid_type', message: 'Only MP4, MOV and WebM videos are supported.' };
    }

    if (file.size > this.maxSize) {
      return { code: 'file_too_large', message: 'Video must be 500 MB or smaller.' };
    }

    return null;
  }

  private generateThumbnail(uploadFile: VideoUploadFile): void {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = uploadFile.previewUrl;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const seekTime = Number.isFinite(duration) ? Math.min(Math.max(duration * 0.1, 0.2), 2) : 0;
      video.currentTime = seekTime;
      this.patchFile({ duration });
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      const width = Math.min(video.videoWidth || 640, 640);
      const height = video.videoWidth ? Math.round(width * (video.videoHeight / video.videoWidth)) : 360;
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(video, 0, 0, width, height);
      const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.72);
      this.patchFile({ thumbnailUrl });
    };

    video.onerror = () => {
      this.failed.emit({
        code: 'thumbnail_failed',
        message: 'Preview loaded, but thumbnail generation was not available for this video.',
      });
    };
  }

  private applyUploadState(state: VideoUploadProgress): void {
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
      window.setTimeout(() => {
        if (this.status() === 'processing') this.status.set('success');
      }, 600);
    }
  }

  private patchFile(patch: Partial<VideoUploadFile>): void {
    const current = this.file();
    if (current) this.file.set({ ...current, ...patch });
  }

  private revokeObjectUrls(): void {
    const selectedFile = this.file();
    if (!selectedFile) return;
    URL.revokeObjectURL(selectedFile.previewUrl);
  }
}
