export interface ImageUploadResponse {
  success: boolean;
  url: string;
  public_id: string;
}

export type ImageUploadStatus = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

export interface ImageUploadProgress {
  status: ImageUploadStatus;
  progress: number;
  response?: ImageUploadResponse;
  error?: string;
}

export interface ImageUploadValidationError {
  code: 'invalid_type' | 'file_too_large' | 'empty_file' | 'upload_failed';
  message: string;
}

export interface ImageUploadFile {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
}
