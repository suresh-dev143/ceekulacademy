import { Component, signal, computed, inject, OnInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorService, ContentType, CreatorBlock, ContentDoc } from '../../../services/creator.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

// ── Types ───────────────────────────────────────────────────────────────────

export type BlockType = 'text' | 'code' | 'image' | 'video' | 'audio' | 'divider' | 'columns';

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, unknown>;
  order: number;
}

export interface UpdateEntry {
  segmentId: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

export interface PersonalizationContext {
  age: number;
  health: string;
  cognition: string;
}

export type UploadMediaType = 'image' | 'video' | 'audio' | 'document' | 'animation' | 'unknown';
export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  mediaType: UploadMediaType;
  size: number;
  preview?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

// ── THE RENDERING PIPELINE ─────────────────────────────────────────────────

@Pipe({
  name: 'ceekulRenderer',
  standalone: true
})
export class CeekulRendererPipe implements PipeTransform {
  /**
   * THE CEEKUL RENDERING PIPELINE (CRP)
   * Pure runtime transformation logic.
   * NEVER persists to database.
   */
  transform(base: string, updates: UpdateEntry[], context: PersonalizationContext | null): string {
    if (!base) return '';
    let rendered = base;

    // 1. THE EVOLUTION OVERLAY
    // Applies deltas from User and AI research layers in real-time.
    updates.forEach(upd => {
      const isAI = upd.type === 'ai';
      // Premium UI: Glassmorphic highlight for AI, deep indigo underline for User
      const tagOpen = isAI 
        ? `<mark style="background: rgba(251, 191, 36, 0.2); border-bottom: 2px solid #fbbf24; color: #fbbf24; padding: 2px 4px; border-radius: 4px; cursor: help;" title="AI Evolution: ${upd.timestamp.toLocaleDateString()}">`
        : `<u style="text-decoration-color: #6366f1; text-underline-offset: 6px; text-decoration-thickness: 2px; cursor: pointer;" title="User Edit">`;
      const tagClose = isAI ? '</mark>' : '</u>';
      
      // Simulation: Replacing segment tags or matching keywords
      // In a production system, this would use a precise segment mapping engine.
      if (rendered.includes(upd.segmentId)) {
        rendered = rendered.replace(new RegExp(upd.segmentId, 'g'), `${tagOpen}${upd.content}${tagClose}`);
      }
    });

    // 2. THE ADAPT ENGINE (RUNTIME-ONLY PERSONALIZATION)
    // Ephemeral transformations based on biological and cognitive context.
    if (context) {
      // Rule: Cognitive Accessibility - High Cognition triggers complex terminology
      if (context.cognition === 'high') {
        rendered = rendered.replace(/Problem:/g, '<strong style="color: #6366f1; letter-spacing: 0.05em;">SYSTEMIC ARCHITECTURAL CHALLENGE:</strong>');
      }

      // Rule: Supportive View - Simple cognition/supportive health triggers bulleted breakdown
      if (context.cognition === 'visual' || context.health === 'recovering') {
        rendered = rendered.replace(/\./g, '. <br>• ');
      }

      // Rule: Age-based Visual Scaling
      if (context.age > 60) {
        rendered = `<div style="font-size: 1.25rem; line-height: 1.8; color: #f8fafc;">${rendered}</div>`;
      } else if (context.age < 18) {
        rendered = `<div style="font-size: 1.1rem; line-height: 1.5; color: #e2e8f0;">${rendered}</div>`;
      }
    }

    return rendered;
  }
}

// ── THE "STATELESS" CREATE SURFACE ──────────────────────────────────────────

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, CeekulRendererPipe],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class Create implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly destroy$ = new Subject<void>();
  private readonly autosave$ = new Subject<void>();

  // ── Persistent Drafting State ──────────────────────────────────────────────
  readonly syncStatus = signal<'synced' | 'saving' | 'error'>('synced');
  readonly isLive = signal(true);
  
  // ── Atomic Identity ───────────────────────────────────────────────────────
  readonly baseId = signal('');
  readonly hybridId = signal('');
  
  // ── Unified Content State ──────────────────────────────────────────────────
  readonly title = signal('');
  readonly subtitle = signal('');
  readonly contentType = signal<ContentType>('L');
  readonly domain = signal('education');
  readonly category = signal<string[]>([]);
  readonly blocks = signal<Block[]>([]);
  
  // ── Evolution Data ─────────────────────────────────────────────────────────
  readonly userUpdates = signal<UpdateEntry[]>([]);
  readonly aiUpdates = signal<UpdateEntry[]>([]);
  readonly personalContext = signal<PersonalizationContext>({
    age: 28,
    health: 'optimal',
    cognition: 'standard'
  });
  readonly isAdapted = signal(false);

  // ── UI Control ─────────────────────────────────────────────────────────────
  readonly activeModal = signal<string | null>(null);
  readonly categoryDropdownOpen = signal(false);

  readonly categoryLabel = computed(() => {
    const cats = this.category();
    if (cats.length === 0) return 'Category';
    if (cats.length === 1) return this.CONTENT_CATEGORIES.find(c => c.id === cats[0])?.label ?? cats[0];
    return `${cats.length} categories`;
  });

  // ── Upload Modal State ────────────────────────────────────────────────────
  readonly uploadTab = signal<'file' | 'ai' | 'embed'>('file');
  readonly uploadFiles = signal<UploadFile[]>([]);
  readonly embedUrl = signal('');
  readonly isDragOver = signal(false);

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
  ];

  readonly CONTENT_CATEGORIES: { id: string; label: string; icon: string }[] = [
    { id: 'course',    label: 'Course',     icon: '📚' },
     { id: 'research',  label: 'Research',   icon: '🔬' },
     { id: 'project',  label: 'Project',   icon: '🏗️' },
    { id: 'webinar',  label: 'Webinar',   icon: '🛠️' },
    { id: 'workshop',  label: 'Workshop',   icon: '🛠️' },
    { id: 'entertainment',   label: 'Entertainment',    icon: '🎓' },
    { id: 'other', label: 'Other',  icon: '📢' },
  
  ];

  readonly BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'text', label: 'Text', icon: '✍', desc: 'Atomic text segment' },
    { type: 'code', label: 'Code', icon: '⌨', desc: 'Code architecture' },
    { type: 'image', label: 'Image', icon: '📸', desc: 'Visual media' },
    { type: 'video', label: 'Video', icon: '🎬', desc: 'Motion content' },
    { type: 'audio', label: 'Audio', icon: '🎵', desc: 'Sonic data' },
    { type: 'divider', label: 'Divider', icon: '―', desc: 'Logical break' },
    { type: 'columns', label: 'Columns', icon: '▤', desc: 'Multi-column layout' },
  ];

  constructor() {
    // Debounced Autosave Orchestration
    this.autosave$.pipe(
      debounceTime(1500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.performAutosave());
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('baseId');
    if (paramId) {
      this.baseId.set(paramId);
      this._loadFromServer(paramId);
    }
  }

  // ── Action Orchestrator ────────────────────────────────────────────────────

  save(): void { this.performAutosave(); }

  update(segmentId: string, content: string): void {
    this.userUpdates.update(u => [...u, { segmentId, content, type: 'user', timestamp: new Date() }]);
    this.onFieldChange();
  }

  // use(): void { this.activeModal.set('use'); }

  share(): void { this.activeModal.set('share'); }

  send(): void { this.activeModal.set('send'); }

  publish(): void {
    this.syncStatus.set('saving');
    setTimeout(() => {
      this.syncStatus.set('synced');
      alert('Atomic Content Published: ' + this.hybridId());
    }, 1200);
  }

  // adapt(): void { this.activeModal.set('adapt'); }

  toggleAdaptation(): void { this.isAdapted.update(v => !v); }

  // ── Library Operations (CRUD) ──────────────────────────────────────────────

  openLibrary(): void {
    this.router.navigate(['/personal/library']);
  }

  loadContent(id: string): void {
    this.baseId.set(id);
    this._loadFromServer(id);
    this.closeModal();
  }

  createNew(): void {
    console.log('Initializing new atomic content...');
    this.baseId.set('');
    this.hybridId.set('');
    this.title.set('');
    this.subtitle.set('');
    this.blocks.set([]);
    this.userUpdates.set([]);
    this.aiUpdates.set([]);
    this.syncStatus.set('synced');
  }

  // ── Internal Logic ─────────────────────────────────────────────────────────

  private performAutosave(): void {
    if (!this.title() || this.blocks().length === 0) return;
    this.syncStatus.set('saving');
    // Simulate API call to /autosave
    setTimeout(() => this.syncStatus.set('synced'), 800);
  }

  onFieldChange(): void {
    this.autosave$.next();
  }

  addBlock(type: BlockType): void {
    const block: Block = {
      id: 'blk_' + Date.now(),
      type,
      content: this._defaultContent(type),
      order: this.blocks().length,
    };
    this.blocks.update(b => [...b, block]);
    this.activeModal.set(null);
    this.onFieldChange();
  }

  getBlockHtml(block: Block): string {
    return (block.content['html'] as string) || '';
  }

  getBlockCode(block: Block): string {
    return (block.content['code'] as string) || '';
  }

  private _defaultContent(type: BlockType): Record<string, unknown> {
    switch (type) {
      case 'text': return { html: '' };
      case 'code': return { code: '', language: 'javascript' };
      default: return {};
    }
  }

  private _loadFromServer(baseId: string): void {
    this.title.set('Neural Architecture Foundations');
    this.hybridId.set('110100000042/0000');
    this.syncStatus.set('synced');
  }

  selectCategory(id: string): void {
    this.category.update(cats =>
      cats.includes(id) ? cats.filter(c => c !== id) : [...cats, id]
    );
    this.onFieldChange();
  }

  // ── Upload Modal ──────────────────────────────────────────────────────────

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    this._processFiles(Array.from(event.dataTransfer?.files ?? []));
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    this._processFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  removeUploadFile(id: string): void {
    this.uploadFiles.update(list => list.filter(f => f.id !== id));
  }

  submitUpload(): void {
    if (this.uploadTab() === 'embed') {
      // TODO: inject embed URL as a block
      this.closeModal();
      return;
    }
    const pending = this.uploadFiles().filter(f => f.status === 'pending');
    pending.forEach(f => this._simulateUpload(f.id));
  }

  getFileIcon(type: UploadMediaType): string {
    const icons: Record<UploadMediaType, string> = {
      image: '🖼️', video: '🎬', audio: '🎵',
      document: '📄', animation: '✨', unknown: '📎',
    };
    return icons[type];
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private _processFiles(files: File[]): void {
    const incoming: UploadFile[] = files.map(file => {
      let error: string | undefined;
      if (!this.ALLOWED_MIME_TYPES.includes(file.type)) error = 'Unsupported format';
      else if (file.size > this.MAX_FILE_SIZE) error = 'File too large (max 50 MB)';

      const uf: UploadFile = {
        id: 'up_' + Date.now() + '_' + Math.random().toString(36).slice(2),
        file,
        name: file.name,
        mediaType: this._detectMediaType(file),
        size: file.size,
        status: error ? 'error' : 'pending',
        progress: 0,
        error,
      };

      if (uf.mediaType === 'image' && !error) {
        const reader = new FileReader();
        reader.onload = e => {
          this.uploadFiles.update(list =>
            list.map(f => f.id === uf.id ? { ...f, preview: e.target?.result as string } : f)
          );
        };
        reader.readAsDataURL(file);
      }

      return uf;
    });

    this.uploadFiles.update(list => [...list, ...incoming]);
  }

  private _detectMediaType(file: File): UploadMediaType {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type === 'application/json') return 'animation';
    if (file.type === 'application/pdf' || file.type.includes('document')) return 'document';
    return 'unknown';
  }

  private _simulateUpload(fileId: string): void {
    this._patchFile(fileId, { status: 'uploading', progress: 0 });

    const interval = setInterval(() => {
      const file = this.uploadFiles().find(f => f.id === fileId);
      if (!file || file.status === 'done' || file.status === 'error') {
        clearInterval(interval);
        return;
      }

      const next = Math.min(file.progress + 15, 100);
      const done = next === 100;
      this._patchFile(fileId, { progress: next, status: done ? 'done' : 'uploading' });

      if (done) {
        clearInterval(interval);
        const allSettled = this.uploadFiles().every(f => f.status === 'done' || f.status === 'error');
        if (allSettled) setTimeout(() => this.closeModal(), 600);
      }
    }, 150);
  }

  private _patchFile(id: string, patch: Partial<UploadFile>): void {
    this.uploadFiles.update(list => list.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  closeModal(): void {
    this.activeModal.set(null);
    this.uploadFiles.set([]);
    this.uploadTab.set('file');
    this.embedUrl.set('');
    this.isDragOver.set(false);
  }
}
