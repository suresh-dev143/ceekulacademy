/**
 * Media Upload Service
 * Manages file upload workflow with RxJS-based queue system
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  Subject,
  timer,
  throwError,
  of,
  EMPTY,
} from 'rxjs';
import {
  catchError,
  finalize,
  map,
  retry,
  switchMap,
  takeUntil,
  tap,
  concatMap,
  filter,
} from 'rxjs/operators';
import {
  UploadFile,
  UploadStatus,
  MediaType,
  MIME_TYPES,
  FILE_EXTENSIONS,
  UNSAFE_FILENAME_PATTERNS,
  UploadConfig,
  UploadStats,
  UploadResponse,
  FileMetadata,
} from './media-upload.types';

@Injectable({
  providedIn: 'root',
})
export class MediaUploadService {
  private readonly DEFAULT_CONFIG: UploadConfig = {
    maxFiles: 10,
    maxFileSize: 20 * 1024 * 1024, // 20 MB
    concurrentUploads: 2,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 1000,
  };

  private config = this.DEFAULT_CONFIG;
  private uploadQueue$ = new BehaviorSubject<UploadFile[]>([]);
  private uploadStats$ = new BehaviorSubject<UploadStats>(this.createEmptyStats());
  private destroy$ = new Subject<void>();

  private activeUploads = new Map<string, Subject<void>>();

  constructor(private http: HttpClient) {
    this.initializeQueueProcessor();
  }

  /**
   * Initialize and process upload queue
   */
  private initializeQueueProcessor(): void {
    this.uploadQueue$
      .pipe(
        switchMap((files) =>
          of(...files).pipe(
            filter((file) => file.status === 'pending'),
            concatMap((file) => this.uploadFile(file)),
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe();
  }

  /**
   * Set upload configuration
   */
  setConfig(config: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): UploadConfig {
    return { ...this.config };
  }

  /**
   * Add files to upload queue
   */
  addFiles(files: FileList | File[]): UploadFile[] {
    const fileArray = Array.from(files);
    const currentQueue = this.uploadQueue$.value;

    // Validation: Max files check
    if (currentQueue.length + fileArray.length > this.config.maxFiles) {
      throw new Error(
        `Maximum ${this.config.maxFiles} files allowed. Current: ${currentQueue.length}`,
      );
    }

    const validatedFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        console.warn(`File validation failed: ${validation.error}`);
        continue;
      }

      const mediaType = this.detectMediaType(file);
      const uploadFile: UploadFile = {
        id: this.generateId(),
        file,
        type: mediaType,
        status: 'pending',
        progress: 0,
        size: file.size,
        metadata: this.extractMetadata(file),
      };

      validatedFiles.push(uploadFile);
      this.generatePreview(uploadFile);
    }

    const updatedQueue = [...currentQueue, ...validatedFiles];
    this.uploadQueue$.next(updatedQueue);
    this.updateStats();

    return validatedFiles;
  }

  /**
   * Remove file from queue
   */
  removeFile(fileId: string): void {
    const currentQueue = this.uploadQueue$.value;
    const fileIndex = currentQueue.findIndex((f) => f.id === fileId);

    if (fileIndex === -1) return;

    const file = currentQueue[fileIndex];

    // Cancel ongoing upload if exists
    if (this.activeUploads.has(fileId)) {
      const cancel$ = this.activeUploads.get(fileId);
      cancel$?.next();
      cancel$?.complete();
      this.activeUploads.delete(fileId);
    }

    const updatedQueue = currentQueue.filter((f) => f.id !== fileId);
    this.uploadQueue$.next(updatedQueue);
    this.updateStats();
  }

  /**
   * Clear all files from queue
   */
  clearQueue(): void {
    this.uploadQueue$.value.forEach((file) => {
      if (this.activeUploads.has(file.id)) {
        const cancel$ = this.activeUploads.get(file.id);
        cancel$?.next();
        cancel$?.complete();
        this.activeUploads.delete(file.id);
      }
    });

    this.uploadQueue$.next([]);
    this.uploadStats$.next(this.createEmptyStats());
  }

  /**
   * Retry failed file upload
   */
  retryUpload(fileId: string): void {
    const queue = this.uploadQueue$.value;
    const file = queue.find((f) => f.id === fileId);

    if (!file) return;

    file.status = 'pending';
    file.progress = 0;
    file.error = undefined;

    const updatedQueue = [...queue];
    this.uploadQueue$.next(updatedQueue);
    this.updateStats();
  }

  /**
   * Get upload queue observable
   */
  getUploadQueue(): Observable<UploadFile[]> {
    return this.uploadQueue$.asObservable();
  }

  /**
   * Get upload statistics observable
   */
  getUploadStats(): Observable<UploadStats> {
    return this.uploadStats$.asObservable();
  }

  /**
   * Upload single file with retry logic
   */
  private uploadFile(uploadFile: UploadFile): Observable<void> {
    uploadFile.status = 'uploading';
    this.updateStats();

    const cancel$ = new Subject<void>();
    this.activeUploads.set(uploadFile.id, cancel$);

    const formData = new FormData();
    formData.append('file', uploadFile.file);
    formData.append('type', uploadFile.type);
    formData.append('metadata', JSON.stringify(uploadFile.metadata));

    return this.http
      .post<HttpEvent<UploadResponse>>('/api/upload/multiple', formData, {
        reportProgress: true,
        responseType: 'json' as any,
      })
      .pipe(
        tap((event: any) => {
          if (event.type === HttpEventType.UploadProgress) {
            const httpProgressEvent = event as HttpProgressEvent;
            if (httpProgressEvent.total) {
              uploadFile.progress = Math.round(
                (httpProgressEvent.loaded / httpProgressEvent.total) * 100,
              );
              this.updateStats();
            }
          }
        }),
        filter((event: any) => event.type === HttpEventType.Response),
        map((event: any) => {
          if (event.body?.success) {
            uploadFile.status = 'completed';
            uploadFile.progress = 100;
            uploadFile.uploadedAt = new Date();

            // Store server response data
            if (event.body.data?.uploadedFiles?.[0]) {
              const serverFile = event.body.data.uploadedFiles[0];
              uploadFile.metadata = {
                name: uploadFile.metadata?.name || serverFile.originalName,
                size: uploadFile.metadata?.size || this.formatFileSize(serverFile.size),
                type: uploadFile.metadata?.type || '',
              };
            }
          } else {
            throw new Error(event.body?.error || 'Upload failed');
          }
        }),
        retry({
          count: this.config.autoRetry ? this.config.maxRetries : 0,
          delay: (error, retryCount) => {
            console.warn(
              `Upload retry ${retryCount} for file ${uploadFile.file.name}`,
              error,
            );
            return timer(this.config.retryDelay);
          },
        }),
        catchError((error) => {
          uploadFile.status = 'failed';
          uploadFile.error = error.message || 'Upload failed';
          this.updateStats();
          return EMPTY;
        }),
        finalize(() => {
          this.activeUploads.delete(uploadFile.id);
          this.updateStats();
        }),
        takeUntil(cancel$),
      );
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { valid: boolean; error?: string } {
    // Check filename for unsafe patterns
    if (UNSAFE_FILENAME_PATTERNS.some((pattern) => pattern.test(file.name))) {
      return { valid: false, error: 'Unsafe filename detected' };
    }

    // Check file size
    if (file.size > this.config.maxFileSize) {
      const maxMB = (this.config.maxFileSize / (1024 * 1024)).toFixed(0);
      return {
        valid: false,
        error: `File size exceeds ${maxMB}MB limit`,
      };
    }

    // Check MIME type
    const mediaType = this.detectMediaType(file);
    const allowedMimes = MIME_TYPES[mediaType];

    if (!allowedMimes.includes(file.type)) {
      return { valid: false, error: `Invalid file type: ${file.type}` };
    }

    // Check file extension
    const fileExtension = this.getFileExtension(file.name);
    const allowedExtensions = FILE_EXTENSIONS[mediaType];

    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return { valid: false, error: `Invalid file extension: ${fileExtension}` };
    }

    return { valid: true };
  }

  /**
   * Detect media type from MIME or extension
   */
  private detectMediaType(file: File): MediaType {
    const mimePrefix = file.type.split('/')[0];

    // Check MIME type prefix first
    if (mimePrefix === 'image') return 'image';
    if (mimePrefix === 'video') return 'video';
    if (mimePrefix === 'audio') return 'audio';

    // Check by extension as fallback
    const extension = this.getFileExtension(file.name).toLowerCase();

    for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
      if (extensions.includes(extension)) {
        return type as MediaType;
      }
    }

    return 'document'; // Default to document
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.'));
  }

  /**
   * Generate preview for supported file types
   */
  private generatePreview(uploadFile: UploadFile): void {
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as string;
      uploadFile.preview = result;
    };

    // Generate preview for images and audios
    if (uploadFile.type === 'image' || uploadFile.type === 'audio') {
      reader.readAsDataURL(uploadFile.file);
    } else if (uploadFile.type === 'video') {
      // For videos, generate thumbnail (simplified - uses first frame)
      this.generateVideoThumbnail(uploadFile.file).then((thumbnail) => {
        uploadFile.preview = thumbnail;
      });
    }
  }

  /**
   * Generate video thumbnail
   */
  private generateVideoThumbnail(file: File): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = 160;
        canvas.height = 90;
        video.currentTime = 0;
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL());
        }
      };

      video.src = URL.createObjectURL(file);
      video.load();

      setTimeout(() => resolve(''), 2000); // Timeout fallback
    });
  }

  /**
   * Extract file metadata
   */
  private extractMetadata(file: File): FileMetadata {
    return {
      name: file.name,
      size: this.formatFileSize(file.size),
      type: file.type,
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Update upload statistics
   */
  private updateStats(): void {
    const queue = this.uploadQueue$.value;
    const stats: UploadStats = {
      totalFiles: queue.length,
      completedFiles: queue.filter((f) => f.status === 'completed').length,
      failedFiles: queue.filter((f) => f.status === 'failed').length,
      totalSize: queue.reduce((sum, f) => sum + f.size, 0),
      uploadedSize: queue
        .filter((f) => f.status === 'completed')
        .reduce((sum, f) => sum + f.size, 0),
      averageProgress:
        queue.length > 0 ? Math.round(queue.reduce((sum, f) => sum + f.progress, 0) / queue.length) : 0,
    };

    this.uploadStats$.next(stats);
  }

  /**
   * Create empty stats object
   */
  private createEmptyStats(): UploadStats {
    return {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      totalSize: 0,
      uploadedSize: 0,
      averageProgress: 0,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.activeUploads.forEach((cancel$) => cancel$.complete());
    this.activeUploads.clear();
  }
}
