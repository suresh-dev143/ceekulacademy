/**
 * Media Upload Service
 * Comprehensive centralized service for all media upload operations
 * With retry support, progress tracking, and error handling
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import {
  Observable,
  Subject,
  throwError,
  of,
  timer,
  BehaviorSubject,
  concat as rxConcat,
  forkJoin,
} from 'rxjs';
import {
  catchError,
  retry,
  tap,
  map,
  switchMap,
  timeout,
  shareReplay,
  withLatestFrom,
  filter,
} from 'rxjs/operators';

import {
  UploadResponse,
  UploadedMedia,
  MultipleUploadResponse,
  DeleteMediaResponse,
  UploadProgress,
  UploadError,
  UploadOptions,
  ImageUploadOptions,
  VideoUploadOptions,
  AudioUploadOptions,
  DocumentUploadOptions,
  BatchUploadRequest,
  BatchUploadResult,
  MediaTypeInfo,
  UploadSession,
  DEFAULT_UPLOAD_CONFIG,
  UPLOAD_ENDPOINTS,
  UPLOAD_FIELD_NAMES,
  MEDIA_MIME_TYPES,
  UPLOAD_SIZE_LIMITS,
  UploadErrorCode,
} from './media-upload.interfaces';
import { UploadErrorHandler } from './media-upload-error-handler';
import { UploadProgressTracker } from './media-upload-progress-tracker';

@Injectable({
  providedIn: 'root',
})
export class MediaUploadService {
  private http = inject(HttpClient);

  private uploadSessions$ = new BehaviorSubject<Map<string, UploadSession>>(
    new Map()
  );
  private activeUploads$ = new BehaviorSubject<Set<string>>(new Set());

  /**
   * Upload single image file
   */
  uploadImage(
    file: File,
    options: ImageUploadOptions = {}
  ): Observable<UploadResponse<UploadedMedia>> {
    return this.uploadMedia(file, 'image', {
      ...DEFAULT_UPLOAD_CONFIG,
      ...options,
    });
  }

  /**
   * Upload single video file
   */
  uploadVideo(
    file: File,
    options: VideoUploadOptions = {}
  ): Observable<UploadResponse<UploadedMedia>> {
    return this.uploadMedia(file, 'video', {
      ...DEFAULT_UPLOAD_CONFIG,
      ...options,
    });
  }

  /**
   * Upload single audio file
   */
  uploadAudio(
    file: File,
    options: AudioUploadOptions = {}
  ): Observable<UploadResponse<UploadedMedia>> {
    return this.uploadMedia(file, 'audio', {
      ...DEFAULT_UPLOAD_CONFIG,
      ...options,
    });
  }

  /**
   * Upload single document file
   */
  uploadDocument(
    file: File,
    options: DocumentUploadOptions = {}
  ): Observable<UploadResponse<UploadedMedia>> {
    return this.uploadMedia(file, 'document', {
      ...DEFAULT_UPLOAD_CONFIG,
      ...options,
    });
  }

  /**
   * Upload multiple files (mixed types)
   */
  uploadMultiple(
    files: File[],
    options: UploadOptions = {}
  ): Observable<MultipleUploadResponse> {
    const config = { ...DEFAULT_UPLOAD_CONFIG, ...options };
    const sessionId = this.generateSessionId();
    const session = this.createSession(sessionId, files);

    return this.createFormData(files, 'multiple')
      .pipe(
        switchMap((formData) =>
          this.http
            .post<MultipleUploadResponse>(
              UPLOAD_ENDPOINTS.multiple,
              formData,
              {
                reportProgress: true,
                headers: this.buildHeaders(config),
                withCredentials: config.withCredentials,
              }
            )
            .pipe(
              tap((event: any) => {
                this.handleProgress(event, config, sessionId);
              }),
              timeout(config.timeout),
              retry({
                count: config.retry?.enabled ? ((config.retry.maxAttempts ?? 1) - 1) : 0,
                delay: (error, retryCount) => {
                  if (retryCount > 0) {
                    console.warn(
                      `Retry attempt ${retryCount} for multiple upload`
                    );
                  }
                  return timer(
                    (config.retry?.delayMs ?? 1000) * Math.pow(2, retryCount - 1)
                  );
                },
              }),
              catchError((error) => this.handleUploadError(error, sessionId)),
              tap(() => this.completeSession(sessionId, true)),
              catchError((error) => {
                this.completeSession(sessionId, false);
                return throwError(() => error);
              })
            )
        )
      );
  }

  /**
   * Upload batch of files with tracking
   */
  uploadBatch(request: BatchUploadRequest): Observable<BatchUploadResult> {
    const sessionId = this.generateSessionId();
    const startTime = Date.now();
    const files = request.files || [];

    if (files.length === 0) {
      return of({
        tag: request.tag,
        successful: [],
        failed: [],
        totalTime: 0,
        averageSpeed: 0,
      });
    }

    const uploadObservables = files.map((file) =>
      this.uploadMediaWithTracking(file, sessionId)
    );

    return forkJoin(uploadObservables).pipe(
      map((uploads: Array<{ success: boolean; data?: UploadedMedia; error?: UploadError }>) => {
        const totalTime = Date.now() - startTime;
        const successful = uploads
          .filter((u) => u.success && u.data)
          .map((u) => u.data as UploadedMedia);
        const failed = uploads
          .filter((u) => !u.success && u.error)
          .map((u, index) => ({
            fileName: files[index]?.name || 'unknown',
            error: u.error as UploadError,
          }));
        const totalSize = files.reduce((sum, f) => sum + f.size, 0);

        return {
          tag: request.tag,
          successful,
          failed,
          totalTime,
          averageSpeed: totalTime > 0 ? (totalSize / totalTime) * 1000 : 0,
        };
      }),
      catchError((error) => {
        const uploadError = UploadErrorHandler.handleError(error);
        UploadErrorHandler.logError('uploadBatch', uploadError);
        return throwError(() => uploadError);
      })
    );
  }

  /**
   * Delete/remove uploaded media
   */
  deleteMedia(publicId: string): Observable<DeleteMediaResponse> {
    const endpoint = UPLOAD_ENDPOINTS.delete.replace(':publicId', publicId);

    return this.http
      .delete<DeleteMediaResponse>(endpoint, {
        headers: this.buildHeaders(DEFAULT_UPLOAD_CONFIG),
      })
      .pipe(
        timeout(DEFAULT_UPLOAD_CONFIG.timeout),
        retry({
          count: 2,
          delay: (error, retryCount) => {
            console.warn(`Retry attempt ${retryCount} for delete operation`);
            return timer(1000 * Math.pow(2, retryCount - 1));
          },
        }),
        catchError((error) =>
          throwError(() => UploadErrorHandler.handleError(error))
        )
      );
  }

  /**
   * Detect media type from file
   */
  detectMediaType(file: File): MediaTypeInfo {
    const mimeType = file.type;
    const fileName = file.name;
    const fileExtension = this.getFileExtension(fileName);

    const mediaEntries = Object.entries(
      MEDIA_MIME_TYPES
    ) as Array<[string, readonly string[]]>;

    for (const [mediaType, mimes] of mediaEntries) {
      if (mimes.includes(mimeType)) {
        return {
          mediaType: mediaType as any,
          mimeType,
          fileExtension,
          isValid: true,
        };
      }
    }

    return {
      mediaType: 'document',
      mimeType,
      fileExtension,
      isValid: false,
      error: `Unsupported file type: ${mimeType}`,
    };
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, mediaType: keyof typeof UPLOAD_SIZE_LIMITS): boolean {
    const maxSize = UPLOAD_SIZE_LIMITS[mediaType];
    return file.size <= maxSize;
  }

  /**
   * Get upload session information
   */
  getSession(sessionId: string): UploadSession | undefined {
    return this.uploadSessions$.value.get(sessionId);
  }

  /**
   * Get all active upload sessions
   */
  getActiveSessions(): UploadSession[] {
    return Array.from(this.uploadSessions$.value.values());
  }

  /**
   * Get active sessions observable
   */
  getActiveSessions$(): Observable<UploadSession[]> {
    return this.uploadSessions$.asObservable().pipe(
      map((sessions) => Array.from(sessions.values()))
    );
  }

  /**
   * Cancel upload session
   */
  cancelSession(sessionId: string): void {
    const sessions = this.uploadSessions$.value;
    sessions.delete(sessionId);
    this.uploadSessions$.next(sessions);

    const active = this.activeUploads$.value;
    active.delete(sessionId);
    this.activeUploads$.next(active);
  }

  // ── Private Helper Methods ─────────────────────────────────────────────

  /**
   * Internal unified upload method
   */
  private uploadMedia(
    file: File,
    mediaType: 'image' | 'video' | 'audio' | 'document',
    options: Required<UploadOptions>
  ): Observable<UploadResponse<UploadedMedia>> {
    const sessionId = this.generateSessionId();
    const tracker = new UploadProgressTracker();

    return this.createFormData([file], mediaType, options.metadata)
      .pipe(
        switchMap((formData) => {
          const endpoint = UPLOAD_ENDPOINTS[mediaType];

          return this.http
            .post<HttpEvent<any>>(
              endpoint,
              formData,
              {
                reportProgress: true,
                observe: 'events',
                headers: this.buildHeaders(options),
                withCredentials: options.withCredentials,
              }
            )
            .pipe(
              tap((event: any) => {
                if (event.type === HttpEventType.UploadProgress) {
                  const progress = tracker.calculateProgress(event);
                  options.onProgress?.(progress);
                }
              }),
              filter((event: any) => event.type === HttpEventType.Response),
              map((event: any) => {
                // Map backend flat response to UploadResponse<UploadedMedia>
                const body = event.body;
                return {
                  success: body.success ?? true,
                  statusCode: event.status ?? 201,
                  message: 'Upload successful',
                  data: {
                    id: body.public_id || '',
                    publicId: body.public_id || '',
                    fileName: file.name,
                    fileSize: body.bytes || file.size,
                    mediaType,
                    mimeType: file.type,
                    uploadedAt: new Date(),
                    url: body.url || '',
                    thumbnailUrl: body.thumbnail,
                    duration: body.duration,
                    dimensions: body.width ? { width: body.width, height: body.height } : undefined,
                  } as UploadedMedia,
                  timestamp: new Date().toISOString(),
                } as UploadResponse<UploadedMedia>;
              }),
              timeout(options.timeout),
              retry({
                count: options.retry.enabled ? (options.retry.maxAttempts || 3) - 1 : 0,
                delay: (error, retryCount) => {
                  if (retryCount > 0) {
                    console.warn(
                      `Retry attempt ${retryCount} for ${mediaType} upload: ${file.name}`
                    );
                  }
                  return timer(
                    (options.retry.delayMs || 1000) * Math.pow(2, retryCount - 1)
                  );
                },
              }),
              catchError((error) => {
                const uploadError = UploadErrorHandler.handleError(error);
                UploadErrorHandler.logError(
                  `uploadMedia[${mediaType}]`,
                  uploadError
                );
                return throwError(() => uploadError);
              })
            );
        })
      );
  }

  /**
   * Upload media with session tracking
   */
  private uploadMediaWithTracking(
    file: File,
    sessionId: string
  ): Observable<{ success: boolean; data?: UploadedMedia; error?: UploadError }> {
    const mediaTypeInfo = this.detectMediaType(file);

    if (!mediaTypeInfo.isValid) {
      return of({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: mediaTypeInfo.error || 'Invalid file type',
          retryable: false,
        },
      });
    }

    return this.uploadMedia(
      file,
      mediaTypeInfo.mediaType,
      DEFAULT_UPLOAD_CONFIG
    ).pipe(
      map((response) => ({
        success: response.success,
        data: response.data,
      })),
      catchError((error) => {
        const uploadError = UploadErrorHandler.handleError(error);
        return of<{ success: boolean; error?: UploadError }>({
          success: false,
          error: uploadError,
        });
      })
    );
  }

  /**
   * Create FormData from files
   */
  private createFormData(
    files: File[],
    mediaType: string = 'multiple',
    metadata?: Record<string, unknown>
  ): Observable<FormData> {
    return of(null).pipe(
      map(() => {
        const formData = new FormData();
        const fieldName = UPLOAD_FIELD_NAMES[mediaType] || 'files';
        files.forEach((file) => {
          formData.append(fieldName, file);
        });

        if (metadata) {
          formData.append('metadata', JSON.stringify(metadata));
        }

        return formData;
      })
    );
  }

  /**
   * Handle progress events
   */
  private handleProgress(
    event: any,
    options: Required<UploadOptions>,
    sessionId: string
  ): void {
    if (event.type === HttpEventType.UploadProgress && event.total) {
      const progress: UploadProgress = {
        loaded: event.loaded,
        total: event.total,
        percentage: Math.round((event.loaded / event.total) * 100),
        state: 'uploading',
      };

      options.onProgress?.(progress);

      // Update session
      const sessions = this.uploadSessions$.value;
      const session = sessions.get(sessionId);
      if (session) {
        session.completedSize = event.loaded;
        session.lastUpdate = new Date();
        sessions.set(sessionId, session);
        this.uploadSessions$.next(sessions);
      }
    }
  }

  /**
   * Handle upload errors with structured response
   */
  private handleUploadError(
    error: Error | HttpErrorResponse,
    sessionId: string
  ): Observable<any> {
    const uploadError = UploadErrorHandler.handleError(error);
    UploadErrorHandler.logError('uploadMedia', uploadError);

    this.completeSession(sessionId, false);

    return throwError(() => uploadError);
  }

  /**
   * Build HTTP headers
   */
  private buildHeaders(options: Required<UploadOptions>): HttpHeaders {
    let headers = new HttpHeaders();

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers = headers.set(key, value);
      });
    }

    return headers;
  }

  /**
   * Create upload session
   */
  private createSession(sessionId: string, files: File[]): UploadSession {
    const session: UploadSession = {
      sessionId,
      startTime: new Date(),
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0),
      completedSize: 0,
      lastUpdate: new Date(),
      status: 'uploading',
    };

    const sessions = this.uploadSessions$.value;
    sessions.set(sessionId, session);
    this.uploadSessions$.next(sessions);

    const active = this.activeUploads$.value;
    active.add(sessionId);
    this.activeUploads$.next(active);

    return session;
  }

  /**
   * Complete upload session
   */
  private completeSession(sessionId: string, success: boolean): void {
    const sessions = this.uploadSessions$.value;
    const session = sessions.get(sessionId);

    if (session) {
      session.status = success ? 'completed' : 'failed';
      session.lastUpdate = new Date();
      sessions.set(sessionId, session);
      this.uploadSessions$.next(sessions);
    }

    const active = this.activeUploads$.value;
    active.delete(sessionId);
    this.activeUploads$.next(active);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get file extension
   */
  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
  }
}
