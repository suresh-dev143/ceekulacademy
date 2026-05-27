/**
 * Media Upload Component
 * Standalone component for managing multiple media file uploads with drag & drop
 */

import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  input,
  output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  MediaUploadService,
} from './media-upload.service';
import {
  UploadFile,
  UploadStats,
  UploadConfig,
  FileMetadata,
} from './media-upload.types';

@Component({
  selector: 'app-media-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './media-upload.component.html',
  styleUrls: ['./media-upload.component.scss'],
})
export class MediaUploadComponent implements OnInit, OnDestroy {
  private uploadService = inject(MediaUploadService);
  private destroy$ = new Subject<void>();

  // Inputs
  config = input<Partial<UploadConfig>>({});
  allowedTypes = input<('image' | 'video' | 'audio' | 'document')[]>([
    'image',
    'video',
    'audio',
    'document',
  ]);
  maxFiles = input<number>(10);
  onUploadComplete = output<UploadFile[]>();

  // Signals
  uploadFiles = signal<UploadFile[]>([]);
  uploadStats = signal<UploadStats>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    uploadedSize: 0,
    averageProgress: 0,
  });

  isDragging = signal(false);
  selectedFile = signal<UploadFile | null>(null);

  // Computed
  isUploadInProgress = computed(() => this.uploadStats().totalFiles > 0);
  hasFailedFiles = computed(() => this.uploadStats().failedFiles > 0);
  allFilesCompleted = computed(
    () =>
      this.uploadStats().totalFiles > 0 &&
      this.uploadStats().completedFiles === this.uploadStats().totalFiles,
  );

  ngOnInit(): void {
    this.uploadService.setConfig({
      maxFiles: this.maxFiles(),
      ...this.config(),
    });

    this.uploadService
      .getUploadQueue()
      .pipe(takeUntil(this.destroy$))
      .subscribe((files) => {
        this.uploadFiles.set(files);

        if (this.allFilesCompleted()) {
          this.onUploadComplete.emit(files);
        }
      });

    this.uploadService
      .getUploadStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.uploadStats.set(stats);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle file drop
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(files);
    }
  }

  /**
   * Handle drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /**
   * Handle drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  /**
   * Handle file input change
   */
  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(input.files);
      input.value = ''; // Reset input
    }
  }

  /**
   * Add files to upload queue
   */
  private addFiles(files: FileList | File[]): void {
    try {
      this.uploadService.addFiles(files);
    } catch (error) {
      console.error('Error adding files:', error);
    }
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    this.uploadService.removeFile(fileId);
    if (this.selectedFile()?.id === fileId) {
      this.selectedFile.set(null);
    }
  }

  /**
   * Retry failed upload
   */
  retryUpload(fileId: string): void {
    this.uploadService.retryUpload(fileId);
  }

  /**
   * Clear all files
   */
  clearQueue(): void {
    this.uploadService.clearQueue();
    this.selectedFile.set(null);
  }

  /**
   * Select file for preview
   */
  selectFile(file: UploadFile): void {
    this.selectedFile.set(file);
  }

  /**
   * Get media type badge class
   */
  getMediaTypeBadgeClass(type: string): string {
    const baseClass = 'badge';
    const typeClass = `badge-${type}`;
    return `${baseClass} ${typeClass}`;
  }

  /**
   * Get status icon
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✕';
      case 'uploading':
        return '⟳';
      default:
        return '○';
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    return this.uploadService.formatFileSize(bytes);
  }

  /**
   * Check if file is image
   */
  isImage(file: UploadFile): boolean {
    return file.type === 'image';
  }

  /**
   * Check if file is audio
   */
  isAudio(file: UploadFile): boolean {
    return file.type === 'audio';
  }

  /**
   * Check if file is video
   */
  isVideo(file: UploadFile): boolean {
    return file.type === 'video';
  }

  /**
   * Check if file is document
   */
  isDocument(file: UploadFile): boolean {
    return file.type === 'document';
  }

  /**
   * Track by file ID for ngFor optimization
   */
  trackByFileId(_index: number, file: UploadFile): string {
    return file.id;
  }
}
