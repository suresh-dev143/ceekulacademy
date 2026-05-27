import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ImageUploadProgress,
  ImageUploadResponse,
  ImageUploadValidationError,
} from '../core/models/image-upload.model';

@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/api/upload/image`;

  uploadImage(file: File): Observable<ImageUploadProgress> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<ImageUploadResponse>(this.endpoint, formData, {
      observe: 'events',
      reportProgress: true,
    }).pipe(
      map(event => this.mapUploadEvent(event)),
      catchError(error => throwError(() => this.normalizeUploadError(error))),
    );
  }

  private mapUploadEvent(event: HttpEvent<ImageUploadResponse>): ImageUploadProgress {
    if (event.type === HttpEventType.Sent) {
      return { status: 'uploading', progress: 1 };
    }

    if (event.type === HttpEventType.UploadProgress) {
      const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 25;
      return { status: 'uploading', progress: Math.min(progress, 99) };
    }

    if (event.type === HttpEventType.Response) {
      const response = event.body;

      if (!response?.success || !response.url || !response.public_id) {
        return {
          status: 'error',
          progress: 0,
          error: 'Upload completed, but the server response was not valid.',
        };
      }

      return { status: 'uploaded', progress: 100, response };
    }

    return { status: 'uploading', progress: 10 };
  }

  private normalizeUploadError(error: unknown): ImageUploadValidationError {
    const message =
      typeof error === 'object' &&
      error !== null &&
      'error' in error &&
      typeof (error as { error?: { message?: unknown } }).error?.message === 'string'
        ? (error as { error: { message: string } }).error.message
        : 'Image upload failed. Please try again.';

    return { code: 'upload_failed', message };
  }
}
