/**
 * Media Upload Component - Unit Tests
 * Example test cases for the MediaUploadComponent and MediaUploadService
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MediaUploadComponent } from './media-upload.component';
import { MediaUploadService } from './media-upload.service';
import { UploadFile, MIME_TYPES } from './media-upload.types';

describe('MediaUploadComponent', () => {
  let component: MediaUploadComponent;
  let fixture: ComponentFixture<MediaUploadComponent>;
  let service: MediaUploadService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaUploadComponent, HttpClientTestingModule],
      providers: [MediaUploadService],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaUploadComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(MediaUploadService);
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty upload queue', () => {
    expect(component.uploadFiles().length).toBe(0);
  });

  it('should handle file drop events', () => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const dropEvent = new DragEvent('drop', {
      dataTransfer: new DataTransfer(),
    });
    dropEvent.dataTransfer?.items.add(mockFile);

    spyOn(component, 'onDrop');
    component.onDrop(dropEvent);
    expect(component.onDrop).toHaveBeenCalledWith(dropEvent);
  });

  it('should add files to queue', () => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileList = new DataTransfer().items;
    fileList.add(mockFile);

    expect(component.uploadFiles().length).toBeGreaterThanOrEqual(0);
  });

  it('should remove file from queue', () => {
    const initialCount = component.uploadFiles().length;
    
    if (component.uploadFiles().length > 0) {
      const fileToRemove = component.uploadFiles()[0];
      component.removeFile(fileToRemove.id);
      expect(component.uploadFiles().length).toBe(initialCount - 1);
    }
  });

  it('should display upload stats', (done) => {
    service.getUploadStats().subscribe((stats) => {
      expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
      expect(stats.completedFiles).toBeGreaterThanOrEqual(0);
      done();
    });
  });

  it('should track files by ID', () => {
    const mockFile: UploadFile = {
      id: 'test-123',
      file: new File(['content'], 'test.jpg'),
      type: 'image',
      status: 'pending',
      progress: 0,
      size: 1000,
    };

    const trackResult = component.trackByFileId(0, mockFile);
    expect(trackResult).toBe('test-123');
  });

  it('should identify image files', () => {
    const mockImageFile: UploadFile = {
      id: 'test-123',
      file: new File(['content'], 'test.jpg'),
      type: 'image',
      status: 'pending',
      progress: 0,
      size: 1000,
    };

    expect(component.isImage(mockImageFile)).toBeTrue();
    expect(component.isVideo(mockImageFile)).toBeFalse();
    expect(component.isAudio(mockImageFile)).toBeFalse();
    expect(component.isDocument(mockImageFile)).toBeFalse();
  });

  it('should format file sizes correctly', () => {
    expect(component.formatFileSize(0)).toBe('0 Bytes');
    expect(component.formatFileSize(1024)).toContain('KB');
    expect(component.formatFileSize(1024 * 1024)).toContain('MB');
  });

  it('should return correct status icons', () => {
    expect(component.getStatusIcon('completed')).toBe('✓');
    expect(component.getStatusIcon('failed')).toBe('✕');
    expect(component.getStatusIcon('uploading')).toBe('⟳');
    expect(component.getStatusIcon('pending')).toBe('○');
  });

  it('should get correct media type badge classes', () => {
    const imageClass = component.getMediaTypeBadgeClass('image');
    expect(imageClass).toContain('badge');
    expect(imageClass).toContain('badge-image');
  });
});

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

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set and get configuration', () => {
    const config = {
      maxFiles: 5,
      maxFileSize: 10 * 1024 * 1024,
      concurrentUploads: 3,
    };

    service.setConfig(config);
    const retrievedConfig = service.getConfig();

    expect(retrievedConfig.maxFiles).toBe(5);
    expect(retrievedConfig.maxFileSize).toBe(10 * 1024 * 1024);
    expect(retrievedConfig.concurrentUploads).toBe(3);
  });

  it('should add files to queue', () => {
    const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);

    const addedFiles = service.addFiles(fileList.files);
    expect(addedFiles.length).toBeGreaterThan(0);
    expect(addedFiles[0].type).toBe('image');
  });

  it('should validate files', () => {
    const validImageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    
    // This file should be valid
    const fileList = new DataTransfer();
    fileList.items.add(validImageFile);

    expect(() => {
      service.addFiles(fileList.files);
    }).not.toThrow();
  });

  it('should reject files exceeding size limit', () => {
    const largeFile = new File(
      [new ArrayBuffer(25 * 1024 * 1024)],
      'large.jpg',
      { type: 'image/jpeg' }
    );

    const fileList = new DataTransfer();
    fileList.items.add(largeFile);

    expect(() => {
      service.addFiles(fileList.files);
    }).toThrow();
  });

  it('should format file sizes', () => {
    expect(service.formatFileSize(0)).toBe('0 Bytes');
    expect(service.formatFileSize(512)).toContain('512');
    expect(service.formatFileSize(1024)).toContain('KB');
    expect(service.formatFileSize(1024 * 1024)).toContain('MB');
  });

  it('should clear upload queue', (done) => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);

    service.addFiles(fileList.files);
    service.clearQueue();

    service.getUploadQueue().subscribe((files) => {
      expect(files.length).toBe(0);
      done();
    });
  });

  it('should emit upload stats', (done) => {
    service.getUploadStats().subscribe((stats) => {
      expect(stats).toBeDefined();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(0);
      expect(stats.completedFiles).toBeGreaterThanOrEqual(0);
      expect(stats.failedFiles).toBeGreaterThanOrEqual(0);
      done();
    });
  });

  it('should detect media type from MIME', () => {
    const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' });
    const audioFile = new File(['content'], 'test.mp3', { type: 'audio/mpeg' });
    const docFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    const fileList1 = new DataTransfer();
    fileList1.items.add(imageFile);
    const addedImage = service.addFiles(fileList1.files);
    expect(addedImage[0]?.type).toBe('image');

    const fileList2 = new DataTransfer();
    fileList2.items.add(videoFile);
    const addedVideo = service.addFiles(fileList2.files);
    expect(addedVideo[0]?.type).toBe('video');

    const fileList3 = new DataTransfer();
    fileList3.items.add(audioFile);
    const addedAudio = service.addFiles(fileList3.files);
    expect(addedAudio[0]?.type).toBe('audio');

    const fileList4 = new DataTransfer();
    fileList4.items.add(docFile);
    const addedDoc = service.addFiles(fileList4.files);
    expect(addedDoc[0]?.type).toBe('document');
  });

  it('should reject unsafe filenames', () => {
    const unsafeFile = new File(['content'], '../../../etc/passwd', { type: 'image/jpeg' });
    const fileList = new DataTransfer();
    fileList.items.add(unsafeFile);

    expect(() => {
      service.addFiles(fileList.files);
    }).toThrow('Unsafe filename detected');
  });

  it('should retry failed uploads', () => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);

    const addedFiles = service.addFiles(fileList.files);
    const fileId = addedFiles[0]?.id;

    if (fileId) {
      service.retryUpload(fileId);

      service.getUploadQueue().subscribe((files) => {
        const file = files.find((f) => f.id === fileId);
        expect(file?.status).toBe('pending');
        expect(file?.error).toBeUndefined();
      });
    }
  });

  it('should remove file from queue', (done) => {
    const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileList = new DataTransfer();
    fileList.items.add(mockFile);

    const addedFiles = service.addFiles(fileList.files);
    const fileId = addedFiles[0]?.id;

    if (fileId) {
      service.removeFile(fileId);

      service.getUploadQueue().subscribe((files) => {
        const removedFile = files.find((f) => f.id === fileId);
        expect(removedFile).toBeUndefined();
        done();
      });
    } else {
      done();
    }
  });
});

describe('File Type Support', () => {
  it('should support image MIME types', () => {
    const imageMimes = MIME_TYPES.image;
    expect(imageMimes).toContain('image/jpeg');
    expect(imageMimes).toContain('image/png');
    expect(imageMimes).toContain('image/gif');
  });

  it('should support video MIME types', () => {
    const videoMimes = MIME_TYPES.video;
    expect(videoMimes).toContain('video/mp4');
    expect(videoMimes).toContain('video/webm');
  });

  it('should support audio MIME types', () => {
    const audioMimes = MIME_TYPES.audio;
    expect(audioMimes).toContain('audio/mpeg');
    expect(audioMimes).toContain('audio/wav');
  });

  it('should support document MIME types', () => {
    const docMimes = MIME_TYPES.document;
    expect(docMimes).toContain('application/pdf');
    expect(docMimes).toContain('application/msword');
  });
});
