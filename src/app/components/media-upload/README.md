# Media Upload Component Documentation

## Overview

A comprehensive, enterprise-grade multiple media upload component for Angular applications. Built with standalone component architecture, RxJS-based queue management, and mobile-optimized responsive design.

## Features

### Core Features
- ✅ **Multiple File Upload** - Upload up to 10 files simultaneously
- ✅ **Multi-Media Support** - Images, videos, audio, and documents
- ✅ **Drag & Drop** - Intuitive file selection with drag-and-drop
- ✅ **Progress Tracking** - Per-file and overall upload progress
- ✅ **Queue Management** - RxJS-based concurrent upload queue system
- ✅ **Retry Logic** - Automatic retry with configurable attempts
- ✅ **File Preview** - Thumbnail previews for images and videos
- ✅ **Cancel Uploads** - Cancel individual or all uploads
- ✅ **Mobile Optimized** - Fully responsive design for all devices

### Validation Features
- ✅ **MIME Type Checking** - Validates file MIME types
- ✅ **Extension Validation** - Verifies file extensions
- ✅ **File Size Limits** - Configurable max file size (default 20 MB)
- ✅ **Unsafe Filename Detection** - Prevents directory traversal attacks
- ✅ **File Count Limits** - Max 10 files per upload session

### UI/UX Features
- ✅ **Status Badges** - Visual indicators for file types and upload status
- ✅ **Error Messages** - Clear, actionable error feedback
- ✅ **Statistics Panel** - Real-time upload statistics
- ✅ **Smooth Animations** - CSS-based transitions and effects
- ✅ **Enterprise Design** - Professional, modern interface
- ✅ **Accessibility** - Full keyboard navigation and ARIA support

## Installation

The component is standalone and requires no additional setup. Simply import it in your component:

```typescript
import { MediaUploadComponent } from './components/media-upload/media-upload.component';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [MediaUploadComponent],
  template: `<app-media-upload></app-media-upload>`,
})
export class MyComponent {}
```

## Usage

### Basic Usage

```html
<app-media-upload
  [maxFiles]="10"
  [allowedTypes]="['image', 'video', 'audio', 'document']"
  (onUploadComplete)="handleUploadComplete($event)"
></app-media-upload>
```

### With Configuration

```typescript
import { Component } from '@angular/core';
import { UploadConfig } from './components/media-upload/media-upload.types';

@Component({
  selector: 'app-upload-demo',
  standalone: true,
  imports: [MediaUploadComponent],
  template: `
    <app-media-upload
      [config]="uploadConfig"
      [maxFiles]="5"
      (onUploadComplete)="onComplete($event)"
    ></app-media-upload>
  `,
})
export class UploadDemoComponent {
  uploadConfig: Partial<UploadConfig> = {
    maxFiles: 5,
    maxFileSize: 50 * 1024 * 1024, // 50 MB
    concurrentUploads: 3,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
  };

  onComplete(files: UploadFile[]): void {
    console.log('Completed uploads:', files);
  }
}
```

## API Reference

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `Partial<UploadConfig>` | `{}` | Upload configuration options |
| `allowedTypes` | `MediaType[]` | `['image','video','audio','document']` | Allowed file types |
| `maxFiles` | `number` | `10` | Maximum number of files |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `onUploadComplete` | `EventEmitter<UploadFile[]>` | Emitted when all files complete upload |

### Service Methods

#### MediaUploadService

```typescript
// Set upload configuration
setConfig(config: Partial<UploadConfig>): void

// Get current configuration
getConfig(): UploadConfig

// Add files to queue
addFiles(files: FileList | File[]): UploadFile[]

// Remove file from queue
removeFile(fileId: string): void

// Clear all files
clearQueue(): void

// Retry failed upload
retryUpload(fileId: string): void

// Get upload queue observable
getUploadQueue(): Observable<UploadFile[]>

// Get upload statistics observable
getUploadStats(): Observable<UploadStats>

// Format file size
formatFileSize(bytes: number): string
```

## Types & Interfaces

### UploadFile
```typescript
interface UploadFile {
  id: string;              // Unique file identifier
  file: File;              // Original file object
  type: MediaType;         // File category (image|video|audio|document)
  status: UploadStatus;    // Current upload status
  progress: number;        // Upload progress (0-100)
  error?: string;          // Error message if failed
  preview?: string;        // Base64 preview (images/audio)
  size: number;            // File size in bytes
  uploadedAt?: Date;       // Timestamp of completion
  metadata?: FileMetadata; // File metadata
}
```

### UploadConfig
```typescript
interface UploadConfig {
  maxFiles: number;           // Max files allowed (default: 10)
  maxFileSize: number;        // Max file size in bytes (default: 20 MB)
  concurrentUploads: number;  // Concurrent upload limit (default: 2)
  autoRetry: boolean;         // Enable auto-retry (default: true)
  maxRetries: number;         // Max retry attempts (default: 2)
  retryDelay: number;         // Delay between retries in ms (default: 1000)
}
```

### UploadStats
```typescript
interface UploadStats {
  totalFiles: number;      // Total files in queue
  completedFiles: number;  // Successfully uploaded files
  failedFiles: number;     // Failed uploads
  totalSize: number;       // Total bytes to upload
  uploadedSize: number;    // Bytes successfully uploaded
  averageProgress: number; // Average progress percentage
}
```

## File Type Support

### Images
- JPEG, PNG, GIF, WebP, SVG
- Max 20 MB per file

### Videos
- MP4, WebM, MOV, AVI, MKV, FLV
- Max 20 MB per file

### Audio
- MP3, WAV, WebM, OGG, AAC, M4A
- Max 20 MB per file

### Documents
- PDF, DOC, DOCX, PPT, PPTX
- Max 20 MB per file

## API Endpoint

The component sends uploads to:

```
POST /api/upload/multiple
```

**Request Format:**
- Content-Type: multipart/form-data
- Each file is sent as a separate form field

**Response Format:**
```json
{
  "success": true,
  "message": "Files uploaded successfully",
  "data": {
    "uploadedFiles": [
      {
        "id": "unique-id",
        "originalName": "filename.ext",
        "storagePath": "/uploads/2024/05/...",
        "size": 1024000,
        "type": "image",
        "uploadedAt": "2024-05-26T10:30:00Z",
        "url": "https://cdn.example.com/file.jpg"
      }
    ],
    "timestamp": "2024-05-26T10:30:00Z"
  }
}
```

## Error Handling

### Validation Errors
- "Maximum X files allowed"
- "File size exceeds Y MB limit"
- "Invalid file type"
- "Invalid file extension"
- "Unsafe filename detected"

### Upload Errors
- Network errors automatically trigger retry logic
- Failed files show error message in UI
- Users can manually retry failed uploads

## CSS Customization

The component uses CSS custom properties for easy theming:

```scss
// Override default colors
.media-upload-container {
  --primary-color: #your-color;
  --success-color: #your-success;
  --error-color: #your-error;
}
```

## Mobile Optimization

- Responsive grid layout (auto-adjusts columns)
- Touch-friendly button sizes (min 36x36px)
- Optimized file preview dimensions
- Mobile-friendly animations
- Breakpoints: 480px, 768px, 1024px

## Accessibility

- ✅ ARIA labels on all interactive elements
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Semantic HTML structure
- ✅ Color contrast WCAG AA compliant
- ✅ Screen reader friendly

## Performance

- **Concurrent Uploads**: Configurable concurrent upload limit
- **Memory Efficient**: Streaming file uploads with progress events
- **Queue Processing**: RxJS-based reactive queue system
- **Thumbnail Generation**: Async thumbnail generation for videos
- **File Size Validation**: Early validation before upload

## Security

- MIME type and extension validation
- Unsafe filename pattern detection
- Directory traversal prevention
- File size limits
- HTTPS recommended for production
- Server-side validation required

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

- Angular 16+ (signals, standalone components)
- RxJS 7+
- Angular Common

No external UI libraries required.

## Examples

See [INTEGRATION_EXAMPLES.ts](./INTEGRATION_EXAMPLES.ts) for:
- Basic integration
- Advanced configuration
- Custom service integration
- Create page integration

## Testing

```typescript
// Example test structure
describe('MediaUploadComponent', () => {
  it('should add files to queue', () => {
    // Test implementation
  });

  it('should validate file types', () => {
    // Test implementation
  });

  it('should upload files to API', () => {
    // Test implementation
  });
});
```

## Troubleshooting

### Files not uploading
1. Verify API endpoint is correct (`/api/upload/multiple`)
2. Check CORS headers on your server
3. Ensure HTTPS in production
4. Verify file meets validation requirements

### Preview not showing
1. Check browser console for errors
2. Verify file type is supported (images/audio only)
3. Ensure file size is reasonable
4. Check browser security policies

### Animations not working
1. Verify animations are enabled in browser
2. Check browser DevTools performance tab
3. Ensure SCSS is compiled properly

## License

Built for Ceekul Academy

## Support

For issues or feature requests, please contact the development team.
