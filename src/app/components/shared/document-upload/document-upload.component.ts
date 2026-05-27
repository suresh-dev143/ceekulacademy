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
  DocumentUploadFile,
  DocumentUploadKind,
  DocumentUploadProgress,
  DocumentUploadResponse,
  DocumentUploadStatus,
  DocumentUploadValidationError,
} from '../../../core/models/document-upload.model';
import { DocumentUploadService } from '../../../services/document-upload.service';

@Component({
  selector: 'app-document-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-upload.component.html',
  styleUrl: './document-upload.component.scss',
})
export class DocumentUploadComponent implements OnDestroy {
  readonly label = input('Upload document');
  readonly helperText = input('PDF, DOCX or PPTX up to 20 MB');
  readonly disabled = input(false);
  readonly autoUpload = input(false);

  readonly selected = output<DocumentUploadFile>();
  readonly uploaded = output<DocumentUploadResponse>();
  readonly removed = output<void>();
  readonly failed = output<DocumentUploadValidationError>();

  private readonly uploadService = inject(DocumentUploadService);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  private uploadSub?: Subscription;

  readonly file = signal<DocumentUploadFile | null>(null);
  readonly status = signal<DocumentUploadStatus>('idle');
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
        return 'No document selected';
    }
  });

  private readonly maxSize = 20 * 1024 * 1024;
  private readonly allowedTypes: Record<DocumentUploadKind, string[]> = {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  };

  ngOnDestroy(): void {
    this.uploadSub?.unsubscribe();
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

    this.uploadSub = this.uploadService.uploadDocument(selectedFile.file).subscribe({
      next: state => this.applyUploadState(state),
      error: (uploadError: DocumentUploadValidationError) => {
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

  iconLabel(kind?: DocumentUploadKind): string {
    return (kind ?? 'pdf').toUpperCase();
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

    const kind = this.getKind(nextFile.name) as DocumentUploadKind;
    const uploadFile: DocumentUploadFile = {
      file: nextFile,
      name: nextFile.name,
      safeName: this.getSafeName(nextFile.name),
      size: nextFile.size,
      type: nextFile.type,
      kind,
    };

    this.file.set(uploadFile);
    this.status.set('selected');
    this.progress.set(0);
    this.loaded.set(0);
    this.total.set(nextFile.size);
    this.error.set(null);
    this.selected.emit(uploadFile);

    if (this.autoUpload()) this.upload();
  }

  private validateFile(file: File): DocumentUploadValidationError | null {
    if (!file.size) {
      return { code: 'empty_file', message: 'Please choose a valid document file.' };
    }

    const kind = this.getKind(file.name);
    if (!kind) {
      return { code: 'invalid_type', message: 'Only PDF, DOCX and PPTX documents are supported.' };
    }

    const allowedMimes = this.allowedTypes[kind];
    if (file.type && !allowedMimes.includes(file.type)) {
      return { code: 'invalid_type', message: 'The document type does not match its file extension.' };
    }

    if (file.name.includes('/') || file.name.includes('\\') || file.name.includes('\0')) {
      return { code: 'unsafe_name', message: 'The file name contains unsafe characters.' };
    }

    if (file.size > this.maxSize) {
      return { code: 'file_too_large', message: 'Document must be 20 MB or smaller.' };
    }

    return null;
  }

  private getKind(fileName: string): DocumentUploadKind | null {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (extension === 'pdf' || extension === 'docx' || extension === 'pptx') return extension;
    return null;
  }

  private getSafeName(fileName: string): string {
    return fileName.replace(/[^\w.\- ()]/g, '_');
  }

  private applyUploadState(state: DocumentUploadProgress): void {
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
}
