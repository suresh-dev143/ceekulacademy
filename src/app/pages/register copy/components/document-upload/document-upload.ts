import { Component, input, output, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentUpload as DocumentUploadModel } from '../../models/registration.models';

@Component({
  selector: 'app-document-upload',
  imports: [CommonModule],
  templateUrl: './document-upload.html',
  styleUrl: './document-upload.scss'
})
export class DocumentUpload {
  label = input<string>('Upload Document');
  accept = input<string>('application/pdf,image/jpeg,image/png,image/jpg');
  maxSize = input<number>(5 * 1024 * 1024); // 5MB
  disabled = input<boolean>(false);

  fileSelected = output<DocumentUploadModel>();
  fileRemoved = output<void>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected readonly isDragging = signal(false);
  protected readonly selectedFile = signal<DocumentUploadModel | null>(null);
  protected readonly error = signal<string | null>(null);

  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled()) {
      this.isDragging.set(true);
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (this.disabled()) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File): void {
    this.error.set(null);

    // Validate file type
    const acceptedTypes = this.accept().split(',').map(t => t.trim());
    if (!acceptedTypes.some(type => file.type.match(type.replace('*', '.*')))) {
      this.error.set('Invalid file type. Please upload PDF, JPG or PNG files only.');
      return;
    }

    // Validate file size
    if (file.size > this.maxSize()) {
      const maxMB = Math.round(this.maxSize() / (1024 * 1024));
      this.error.set(`File size exceeds ${maxMB}MB limit.`);
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    const upload: DocumentUploadModel = {
      id: crypto.randomUUID(),
      type: 'aadhaar', // Default, can be changed by parent
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'uploaded',
      previewUrl
    };

    this.selectedFile.set(upload);
    this.fileSelected.emit(upload);
  }

  removeFile(): void {
    const current = this.selectedFile();
    if (current?.previewUrl) {
      URL.revokeObjectURL(current.previewUrl);
    }
    this.selectedFile.set(null);
    this.error.set(null);
    this.fileRemoved.emit();

    // Reset file input
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
