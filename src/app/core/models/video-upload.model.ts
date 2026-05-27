export interface VideoUploadResponse {
  success: boolean;
  url: string;
  public_id: string;
  thumbnail_url?: string;
  duration?: number;
}

export type VideoUploadStatus =
  | 'idle'
  | 'selected'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error'
  | 'canceled';

export interface VideoUploadProgress {
  status: VideoUploadStatus;
  progress: number;
  loaded: number;
  total: number;
  response?: VideoUploadResponse;
  error?: string;
}

export interface VideoUploadValidationError {
  code: 'invalid_type' | 'file_too_large' | 'empty_file' | 'upload_failed' | 'thumbnail_failed';
  message: string;
}

export interface VideoUploadFile {
  file: File;
  previewUrl: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  type: string;
  duration?: number;
}

export interface VideoUploadChunk {
  blob: Blob;
  index: number;
  start: number;
  end: number;
  size: number;
}

export interface VideoUploadRequestOptions {
  chunkUploadReady?: boolean;
  uploadId?: string;
  chunkIndex?: number;
  totalChunks?: number;
}
