import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AudioUploadProgress,
  AudioUploadResponse,
  AudioUploadValidationError,
} from '../core/models/audio-upload.model';

@Injectable({ providedIn: 'root' })
export class AudioUploadService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/upload/audio`;

  uploadAudio(file: File): Observable<AudioUploadProgress> {
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('fileName', file.name);
    formData.append('fileSize', String(file.size));
    formData.append('mimeType', file.type);

    return this.http.post<AudioUploadResponse>(this.endpoint, formData, {
      observe: 'events',
      reportProgress: true,
    }).pipe(
      map(event => this.mapUploadEvent(event, file.size)),
      catchError(error => throwError(() => this.normalizeUploadError(error))),
    );
  }

  private mapUploadEvent(event: HttpEvent<AudioUploadResponse>, fallbackTotal: number): AudioUploadProgress {
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
        status: 'uploaded',
        progress: 100,
        loaded: fallbackTotal,
        total: fallbackTotal,
        response,
      };
    }

    return { status: 'uploading', progress: 10, loaded: 0, total: fallbackTotal };
  }

  private normalizeUploadError(error: unknown): AudioUploadValidationError {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
        ? (error as { error: { message: string } }).error.message
        : 'Audio upload failed. Please try again.';

    return { code: 'upload_failed', message };
  }
}
