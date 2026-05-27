export type DocumentUploadKind = 'pdf' | 'docx' | 'pptx';

export interface DocumentUploadResponse {
  success: boolean;
  url: string;
  public_id: string;
  fileName?: string;
  fileType?: DocumentUploadKind;
}

export type DocumentUploadStatus = 'idle' | 'selected' | 'uploading' | 'uploaded' | 'error';

export interface DocumentUploadProgress {
  status: DocumentUploadStatus;
  progress: number;
  loaded: number;
  total: number;
  response?: DocumentUploadResponse;
  error?: string;
}

export interface DocumentUploadValidationError {
  code: 'invalid_type' | 'file_too_large' | 'empty_file' | 'unsafe_name' | 'upload_failed';
  message: string;
}

export interface DocumentUploadFile {
  file: File;
  name: string;
  safeName: string;
  size: number;
  type: string;
  kind: DocumentUploadKind;
}
