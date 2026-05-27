# Media Upload Service - Documentation

## Overview

A production-grade, type-safe Angular service for comprehensive media upload operations with automatic retry, progress tracking, and centralized error handling.

## Architecture

### Core Components

1. **media-upload.service.ts** - Main service with upload methods
2. **media-upload.interfaces.ts** - Type definitions and constants
3. **media-upload-error-handler.ts** - Error handling and transformation
4. **media-upload-progress-tracker.ts** - Progress calculation and formatting

## Service Methods

### Single File Uploads

```typescript
// Upload image
uploadImage(file: File, options?: ImageUploadOptions): Observable<UploadResponse<UploadedMedia>>

// Upload video
uploadVideo(file: File, options?: VideoUploadOptions): Observable<UploadResponse<UploadedMedia>>

// Upload audio
uploadAudio(file: File, options?: AudioUploadOptions): Observable<UploadResponse<UploadedMedia>>

// Upload document
uploadDocument(file: File, options?: DocumentUploadOptions): Observable<UploadResponse<UploadedMedia>>
```

### Multiple File Uploads

```typescript
// Upload multiple files at once
uploadMultiple(files: File[], options?: UploadOptions): Observable<MultipleUploadResponse>

// Upload batch with detailed tracking
uploadBatch(request: BatchUploadRequest): Observable<BatchUploadResult>
```

### Media Management

```typescript
// Delete/remove uploaded media
deleteMedia(publicId: string): Observable<DeleteMediaResponse>

// Detect file type
detectMediaType(file: File): MediaTypeInfo

// Validate file
validateFile(file: File, mediaType: 'image' | 'video' | 'audio' | 'document'): boolean
```

### Session Management

```typescript
// Get session info
getSession(sessionId: string): UploadSession | undefined

// Get all active sessions
getActiveSessions(): UploadSession[]
getActiveSessions$(): Observable<UploadSession[]>

// Cancel session
cancelSession(sessionId: string): void
```

## Usage Examples

### Basic Single File Upload

```typescript
import { Component, inject } from '@angular/core';
import { MediaUploadService } from './services/media-upload/media-upload.service';

@Component({
  selector: 'app-image-uploader',
  template: `
    <input type="file" accept="image/*" (change)="onImageSelect($event)" />
    <div *ngIf="uploading">Uploading: {{ uploadProgress }}%</div>
  `,
})
export class ImageUploaderComponent {
  uploadService = inject(MediaUploadService);
  uploading = false;
  uploadProgress = 0;

  onImageSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    this.uploading = true;
    this.uploadService
      .uploadImage(file, {
        onProgress: (progress) => {
          this.uploadProgress = progress.percentage;
        },
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Image uploaded:', response.data);
          }
          this.uploading = false;
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.uploading = false;
        },
      });
  }
}
```

### Advanced: Multiple Files with Batch Tracking

```typescript
uploadMultipleFiles(files: File[]): void {
  const batchRequest: BatchUploadRequest = {
    files,
    tag: 'content-batch-001',
    options: {
      retry: { enabled: true, maxAttempts: 3, delayMs: 1500 },
      timeout: 600000, // 10 minutes
      onProgress: (progress) => {
        console.log(
          `Progress: ${progress.percentage}% - ` +
          `Speed: ${UploadProgressTracker.formatSpeed(progress.uploadSpeed)} - ` +
          `ETA: ${UploadProgressTracker.formatTime(progress.remainingTime || 0)}`
        );
      },
    },
  };

  this.uploadService.uploadBatch(batchRequest).subscribe({
    next: (result) => {
      console.log(`Batch complete:`, {
        successful: result.successful.length,
        failed: result.failed.length,
        totalTime: UploadProgressTracker.formatTime(result.totalTime / 1000),
        averageSpeed: UploadProgressTracker.formatSpeed(result.averageSpeed),
      });
    },
    error: (error) => {
      console.error('Batch upload failed:', error);
    },
  });
}
```

### Centralized Error Handling

```typescript
import { UploadErrorHandler, UploadError } from './services/media-upload/media-upload-error-handler';

onUploadError(error: any): void {
  const uploadError: UploadError = UploadErrorHandler.handleError(error);

  // Check if retryable
  if (UploadErrorHandler.isRetryable(uploadError)) {
    console.log('Error is retryable, attempting retry...');
    // Implement retry logic
  }

  // Format for user display
  const userMessage = UploadErrorHandler.formatErrorMessage(uploadError);
  this.showNotification(userMessage);

  // Log for debugging
  UploadErrorHandler.logError('MyComponent.onUploadError', uploadError);
}
```

### With Service Injection

```typescript
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { MediaUploadService } from './services/media-upload/media-upload.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-upload-manager',
  template: `
    <div class="active-uploads">
      <h3>Active Uploads: {{ activeSessions.length }}</h3>
      <div *ngFor="let session of activeSessions">
        <p>{{ session.fileCount }} files - {{ formatSize(session.totalSize) }}</p>
        <progress [value]="session.completedSize" [max]="session.totalSize"></progress>
      </div>
    </div>
  `,
})
export class UploadManagerComponent implements OnInit, OnDestroy {
  private uploadService = inject(MediaUploadService);
  private destroy$ = new Subject<void>();

  activeSessions: any[] = [];

  ngOnInit(): void {
    this.uploadService
      .getActiveSessions$()
      .pipe(takeUntil(this.destroy$))
      .subscribe((sessions) => {
        this.activeSessions = sessions;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private formatSize(bytes: number): string {
    return UploadProgressTracker.formatBytes(bytes);
  }
}
```

## File Type Support

### Images
- JPEG, PNG, GIF, WebP, SVG, TIFF
- Max: 50 MB

### Videos
- MP4, WebM, MOV, AVI, MKV, FLV
- Max: 500 MB

### Audio
- MP3, WAV, WebM, OGG, AAC, FLAC, M4A
- Max: 100 MB

### Documents
- PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
- Max: 100 MB

## Configuration

### Default Configuration

```typescript
const DEFAULT_UPLOAD_CONFIG = {
  retry: { enabled: true, maxAttempts: 3, delayMs: 1000 },
  timeout: 300000, // 5 minutes
  metadata: {},
  onProgress: () => {},
  headers: {},
  withCredentials: false,
};
```

### Custom Configuration

```typescript
this.uploadService.uploadImage(file, {
  retry: { enabled: true, maxAttempts: 5, delayMs: 2000 },
  timeout: 600000, // 10 minutes
  compress: true,
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  optimizeForWeb: true,
  onProgress: (progress) => {
    console.log(`Uploading: ${progress.percentage}%`);
  },
});
```

## Error Handling

### Error Codes

```typescript
enum UploadErrorCode {
  NETWORK_ERROR           // Network connectivity issue
  VALIDATION_ERROR        // File validation failed (400)
  SERVER_ERROR            // Server error (5xx)
  TIMEOUT_ERROR           // Request timeout
  AUTH_ERROR              // Authentication required (401)
  FORBIDDEN_ERROR         // Permission denied (403)
  NOT_FOUND_ERROR         // Endpoint not found (404)
  CONFLICT_ERROR          // Conflict detected (409)
  FILE_TOO_LARGE          // File exceeds size limit (413)
  INVALID_FILE_TYPE       // Unsupported file type
  UNKNOWN_ERROR           // Other errors
}
```

### Error Response Structure

```typescript
interface UploadError {
  code: string;           // Error code
  message: string;        // Human-readable message
  statusCode?: number;    // HTTP status code
  details?: string;       // Additional details
  retryable: boolean;     // Can user retry?
  originalError?: Error;  // Original error object
}
```

## API Endpoints

```
POST /api/upload/image           - Upload single image
POST /api/upload/video           - Upload single video
POST /api/upload/audio           - Upload single audio
POST /api/upload/document        - Upload single document
POST /api/upload/multiple        - Upload multiple files
DELETE /api/upload/:publicId     - Delete media
```

## Response Format

### Success Response

```json
{
  "success": true,
  "statusCode": 201,
  "message": "File uploaded successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "publicId": "img_abc123xyz",
    "fileName": "my-image.jpg",
    "fileSize": 1024000,
    "mediaType": "image",
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-05-26T10:30:00Z",
    "url": "https://cdn.example.com/uploads/img_abc123xyz.jpg",
    "thumbnailUrl": "https://cdn.example.com/uploads/img_abc123xyz_thumb.jpg"
  },
  "timestamp": "2024-05-26T10:30:00Z"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 413,
  "message": "File is too large",
  "error": {
    "code": "FILE_TOO_LARGE",
    "details": "Maximum file size is 50MB"
  },
  "timestamp": "2024-05-26T10:30:00Z"
}
```

## Security Features

✅ MIME type validation
✅ File extension validation
✅ File size limits (per type)
✅ Timeout protection
✅ Automatic retry with exponential backoff
✅ Error tracking and logging
✅ HTTPS ready
✅ Session-based tracking

## Performance Features

✅ Progress tracking per file
✅ Concurrent upload support
✅ RxJS reactive streams
✅ Error recovery with retry
✅ Session management
✅ Bandwidth aware

## Testing

```typescript
describe('MediaUploadService', () => {
  let service: MediaUploadService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MediaUploadService],
    });

    service = TestBed.inject(MediaUploadService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  it('should upload image successfully', (done) => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    service.uploadImage(mockFile).subscribe({
      next: (response) => {
        expect(response.success).toBe(true);
        expect(response.data?.mediaType).toBe('image');
        done();
      },
    });

    const req = httpTestingController.expectOne('/api/upload/image');
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, statusCode: 201 });
  });
});
```

## Best Practices

1. **Always handle errors**: Use the error handler for consistent error handling
2. **Track progress**: Show progress UI for better UX
3. **Validate files**: Check file type and size before upload
4. **Use appropriate timeouts**: Longer for large files
5. **Implement retry logic**: Let service handle retries
6. **Monitor sessions**: Track active uploads
7. **Clean up**: Cancel sessions when needed

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers

## License

Built for Ceekul Academy
