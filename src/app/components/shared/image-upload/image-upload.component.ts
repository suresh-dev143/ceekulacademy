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
  ImageUploadFile,
  ImageUploadProgress,
  ImageUploadResponse,
  ImageUploadStatus,
  ImageUploadValidationError,
} from '../../../core/models/image-upload.model';
import { ImageUploadService } from '../../../services/image-upload.service';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss',
})
export class ImageUploadComponent implements OnDestroy {
  readonly label = input('Upload image');
  readonly helperText = input('JPG, JPEG, PNG or WebP up to 10 MB');
  readonly disabled = input(false);
  readonly autoUpload = input(false);

  readonly selected = output<ImageUploadFile>();
  readonly uploaded = output<ImageUploadResponse>();
  readonly removed = output<void>();
  readonly failed = output<ImageUploadValidationError>();

  private readonly uploadService = inject(ImageUploadService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private uploadSub?: Subscription;

  readonly file = signal<ImageUploadFile | null>(null);
  readonly status = signal<ImageUploadStatus>('idle');
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);
  readonly isDragOver = signal(false);

  readonly hasFile = computed(() => !!this.file());
  readonly isUploading = computed(() => this.status() === 'uploading');
  readonly canUpload = computed(
    () => this.hasFile() && !this.isUploading() && this.status() !== 'uploaded' && !this.error(),
  );

  private readonly maxSize = 10 * 1024 * 1024;
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

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
    this.error.set(null);

    this.uploadSub = this.uploadService.uploadImage(selectedFile.file).subscribe({
      next: state => this.applyUploadState(state),
      error: (uploadError: ImageUploadValidationError) => {
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
    this.error.set(null);
    this.removed.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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

    const uploadFile: ImageUploadFile = {
      file: nextFile,
      previewUrl: URL.createObjectURL(nextFile),
      name: nextFile.name,
      size: nextFile.size,
      type: nextFile.type,
    };

    this.file.set(uploadFile);
    this.status.set('selected');
    this.progress.set(0);
    this.error.set(null);
    this.selected.emit(uploadFile);

    if (this.autoUpload()) this.upload();
  }

  private validateFile(file: File): ImageUploadValidationError | null {
    if (!file.size) {
      return { code: 'empty_file', message: 'Please choose a valid image file.' };
    }

    if (!this.allowedTypes.includes(file.type)) {
      return { code: 'invalid_type', message: 'Only JPG, JPEG, PNG and WebP images are supported.' };
    }

    if (file.size > this.maxSize) {
      return { code: 'file_too_large', message: 'Image must be 10 MB or smaller.' };
    }

    return null;
  }

  private applyUploadState(state: ImageUploadProgress): void {
    this.status.set(state.status);
    this.progress.set(state.progress);

    if (state.error) {
      this.error.set(state.error);
      this.failed.emit({ code: 'upload_failed', message: state.error });
    }

    if (state.response) {
      this.error.set(null);
      this.uploaded.emit(state.response);
    }
  }

  private revokePreview(): void {
    const previewUrl = this.file()?.previewUrl;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }
}
