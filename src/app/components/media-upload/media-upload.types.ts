/**
 * Media Upload Component - Type Definitions
 * Handles all interfaces and types for the upload system
 */

export type MediaType = 'image' | 'video' | 'audio' | 'document';
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed';

/**
 * Supported MIME types per media category
 */
export const MIME_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/aac'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
};

/**
 * File extension patterns per media category
 */
export const FILE_EXTENSIONS: Record<MediaType, string[]> = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  video: ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.flv'],
  audio: ['.mp3', '.wav', '.webm', '.ogg', '.aac', '.m4a'],
  document: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
};

/**
 * File upload item metadata
 */
export interface UploadFile {
  id: string;
  file: File;
  type: MediaType;
  status: UploadStatus;
  progress: number;
  error?: string;
  preview?: string;
  size: number;
  uploadedAt?: Date;
  metadata?: FileMetadata;
}

/**
 * File metadata extracted for preview
 */
export interface FileMetadata {
  name: string;
  size: string;
  type: string;
  duration?: number; // for video/audio in seconds
  dimensions?: { width: number; height: number }; // for images
}

/**
 * API request payload
 */
export interface UploadRequest {
  files: FormData;
  metadata?: Record<string, unknown>;
}

/**
 * API response from upload endpoint
 */
export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    uploadedFiles: UploadedFileInfo[];
    timestamp: string;
  };
  error?: string;
}

/**
 * Uploaded file information from server
 */
export interface UploadedFileInfo {
  id: string;
  originalName: string;
  storagePath: string;
  size: number;
  type: MediaType;
  uploadedAt: string;
  url?: string;
}

/**
 * Upload queue configuration
 */
export interface UploadConfig {
  maxFiles: number;
  maxFileSize: number; // in bytes
  concurrentUploads: number;
  autoRetry: boolean;
  maxRetries: number;
  retryDelay: number; // in milliseconds
}

/**
 * Upload statistics
 */
export interface UploadStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  uploadedSize: number;
  averageProgress: number;
}

/**
 * Unsafe filename patterns - files matching these will be rejected
 */
export const UNSAFE_FILENAME_PATTERNS = [
  /\.\.\//g, // Directory traversal
  /\.exe$/i, // Executables
  /\.bat$/i,
  /\.cmd$/i,
  /\.com$/i,
  /\.pif$/i,
  /\.scr$/i,
  /\.vbs$/i,
  /\.ps1$/i,
];
