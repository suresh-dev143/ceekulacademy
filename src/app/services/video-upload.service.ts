import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  VideoUploadChunk,
  VideoUploadProgress,
  VideoUploadRequestOptions,
  VideoUploadResponse,
  VideoUploadValidationError,
} from '../core/models/video-upload.model';

@Injectable({ providedIn: 'root' })
export class VideoUploadService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/upload/video`;
  readonly defaultChunkSize = 8 * 1024 * 1024;

  uploadVideo(file: File, options: VideoUploadRequestOptions = {}): Observable<VideoUploadProgress> {
    const formData = this.createFormData(file, options);

    return this.http.post<VideoUploadResponse>(this.endpoint, formData, {
      observe: 'events',
      reportProgress: true,
    }).pipe(
      map(event => this.mapUploadEvent(event, file.size)),
      catchError(error => throwError(() => this.normalizeUploadError(error))),
    );
  }

  createChunks(file: File, chunkSize = this.defaultChunkSize): VideoUploadChunk[] {
    const chunks: VideoUploadChunk[] = [];
    let start = 0;

    while (start < file.size) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        blob: file.slice(start, end),
        index: chunks.length,
        start,
        end,
        size: end - start,
      });
      start = end;
    }

    return chunks;
  }

  private createFormData(file: File, options: VideoUploadRequestOptions): FormData {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('fileName', file.name);
    formData.append('fileSize', String(file.size));
    formData.append('mimeType', file.type);

    if (options.chunkUploadReady) {
      formData.append('chunkUploadReady', 'true');
      if (options.uploadId) formData.append('uploadId', options.uploadId);
      if (options.chunkIndex !== undefined) formData.append('chunkIndex', String(options.chunkIndex));
      if (options.totalChunks !== undefined) formData.append('totalChunks', String(options.totalChunks));
    }

    return formData;
  }

  private mapUploadEvent(event: HttpEvent<VideoUploadResponse>, fallbackTotal: number): VideoUploadProgress {
    if (event.type === HttpEventType.Sent) {
      return { status: 'uploading', progress: 1, loaded: 0, total: fallbackTotal };
    }

    if (event.type === HttpEventType.UploadProgress) {
      const total = event.total ?? fallbackTotal;
      const progress = total ? Math.round((event.loaded / total) * 100) : 25;
      return {
        status: 'uploading',
        progress: Math.min(progress, 99),
        loaded: event.loaded,
        total,
      };
    }

    if (event.type === HttpEventType.Response) {
      const response = event.body;

      if (!response?.success || !response.url || !response.public_id) {
        return {
          status: 'error',
          progress: 0,
          loaded: 0,
          total: fallbackTotal,
          error: 'Upload completed, but the server response was not valid.',
        };
      }

      return {
        status: 'processing',
        progress: 100,
        loaded: fallbackTotal,
        total: fallbackTotal,
        response,
      };
    }

    return { status: 'uploading', progress: 10, loaded: 0, total: fallbackTotal };
  }

  private normalizeUploadError(error: unknown): VideoUploadValidationError {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
        ? (error as { error: { message: string } }).error.message
        : 'Video upload failed. Please try again.';

    return { code: 'upload_failed', message };
  }
}
