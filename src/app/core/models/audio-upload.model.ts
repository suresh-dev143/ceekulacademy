export interface AudioUploadResponse {
  success: boolean;
  url: string;
  public_id: string;
  duration?: number;
}

export type AudioUploadStatus = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

export interface AudioUploadProgress {
  status: AudioUploadStatus;
  progress: number;
  loaded: number;
  total: number;
  response?: AudioUploadResponse;
  error?: string;
}

export interface AudioUploadValidationError {
  code: 'invalid_type' | 'file_too_large' | 'empty_file' | 'upload_failed';
  message: string;
}

export interface AudioUploadFile {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  type: string;
  duration?: number;
}
