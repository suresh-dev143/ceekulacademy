/**
 * Media Upload Service - Interfaces & Types
 * Centralized type definitions for all upload operations
 */

import { environment } from '../../../environments/environment';

export type MediaTypeEndpoint = 'image' | 'video' | 'audio' | 'document' | 'multiple';

/**
 * Upload progress tracking information
 */
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  state: 'pending' | 'uploading' | 'completed' | 'failed';
  remainingTime?: number;
  uploadSpeed?: number; // bytes per second
}

/**
 * Media metadata after successful upload
 */
export interface UploadedMedia {
  id: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  uploadedAt: Date;
  url: string;
  thumbnailUrl?: string;
  duration?: number; // for video/audio
  dimensions?: { width: number; height: number }; // for images
  metadata?: Record<string, unknown>;
}

/**
 * Unified upload response format
 */
export interface UploadResponse<T = UploadedMedia> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: string;
  };
  timestamp: string;
}

/**
 * Multiple files upload response
 */
export interface MultipleUploadResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    uploadedFiles: UploadedMedia[];
    failedFiles?: Array<{ fileName: string; error: string }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  timestamp: string;
}

/**
 * Delete/remove media response
 */
export interface DeleteMediaResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    publicId: string;
    deletedAt: Date;
  };
  timestamp: string;
}

/**
 * Upload error with detailed information
 */
export interface UploadError {
  code: string; // Error code
  message: string;
  statusCode?: number;
  details?: string;
  retryable: boolean;
  originalError?: Error;
}

/**
 * Upload configuration for individual requests
 */
export interface UploadOptions {
  retry?: {
    enabled: boolean;
    maxAttempts?: number;
    delayMs?: number;
  };
  timeout?: number;
  metadata?: Record<string, unknown>;
  onProgress?: (progress: UploadProgress) => void;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

/**
 * Image-specific upload options
 */
export interface ImageUploadOptions extends UploadOptions {
  compress?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  optimizeForWeb?: boolean;
}

/**
 * Video-specific upload options
 */
export interface VideoUploadOptions extends UploadOptions {
  generateThumbnail?: boolean;
  maxDuration?: number;
  targetResolution?: '480p' | '720p' | '1080p' | '4k';
}

/**
 * Audio-specific upload options
 */
export interface AudioUploadOptions extends UploadOptions {
  extractMetadata?: boolean;
  normalizeAudio?: boolean;
}

/**
 * Document-specific upload options
 */
export interface DocumentUploadOptions extends UploadOptions {
  extractPages?: boolean;
  ocrEnabled?: boolean;
}

/**
 * Batch upload request
 */
export interface BatchUploadRequest {
  files: File[];
  options?: UploadOptions;
  tag?: string; // group uploads by tag
}

/**
 * Batch upload result
 */
export interface BatchUploadResult {
  tag?: string;
  successful: UploadedMedia[];
  failed: Array<{ fileName: string; error: UploadError }>;
  totalTime: number;
  averageSpeed: number; // bytes per second
}

/**
 * Media type detection result
 */
export interface MediaTypeInfo {
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mimeType: string;
  fileExtension: string;
  isValid: boolean;
  error?: string;
}

/**
 * Upload session tracking
 */
export interface UploadSession {
  sessionId: string;
  startTime: Date;
  fileCount: number;
  totalSize: number;
  completedSize: number;
  lastUpdate: Date;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

/**
 * Default upload configuration
 */
export const DEFAULT_UPLOAD_CONFIG: Required<UploadOptions> = {
  retry: { enabled: true, maxAttempts: 3, delayMs: 1000 },
  timeout: 300000, // 5 minutes
  metadata: {},
  onProgress: () => {},
  headers: {},
  withCredentials: false,
};

/**
 * API endpoint base paths
 */
export const UPLOAD_ENDPOINTS = {
  image: `${environment.apiUrl}/api/upload/image`,
  video: `${environment.apiUrl}/api/upload/video`,
  audio: `${environment.apiUrl}/api/upload/audio`,
  document: `${environment.apiUrl}/api/upload/document`,
  multiple: `${environment.apiUrl}/api/upload/multiple`,
  delete: `${environment.apiUrl}/api/upload/:publicId`,
} as const;

/**
 * FormData field names expected by backend multer middleware
 */
export const UPLOAD_FIELD_NAMES: Record<string, string> = {
  image: 'image',
  video: 'video',
  audio: 'audio',
  document: 'document',
  multiple: 'files',
} as const;

/**
 * MIME type mappings
 */
export const MEDIA_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/tiff',
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/x-flv',
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'audio/x-m4a',
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
  ],
} as const;

/**
 * File size limits (in bytes)
 */
export const UPLOAD_SIZE_LIMITS = {
  image: 50 * 1024 * 1024, // 50 MB
  video: 500 * 1024 * 1024, // 500 MB
  audio: 100 * 1024 * 1024, // 100 MB
  document: 100 * 1024 * 1024, // 100 MB
  multiple: 1024 * 1024 * 1024, // 1 GB total
} as const;

/**
 * HTTP status codes
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * Error codes
 */
export enum UploadErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  FORBIDDEN_ERROR = 'FORBIDDEN_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
