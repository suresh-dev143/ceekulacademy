import { Component, signal, computed, inject, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorService, ContentType, ContentState, CreatorBlock, DraftPayload } from '../../../services/creator.service';
import { ClaudeService } from '../../../services/claude.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../components/toast/toast';
import { Subject, takeUntil } from 'rxjs';

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

@Pipe({ name: 'ceekulRenderer', standalone: true })
export class CeekulRendererPipe implements PipeTransform {
  transform(base: string, updates: UpdateEntry[], context: PersonalizationContext | null): string {
    if (!base) return '';
    let rendered = base;

    updates.forEach(upd => {
      const isAI = upd.type === 'ai';
      const tagOpen = isAI
        ? `<mark style="background:rgba(251,191,36,0.2);border-bottom:2px solid #fbbf24;color:#fbbf24;padding:2px 4px;border-radius:4px;cursor:help;" title="AI Evolution: ${upd.timestamp.toLocaleDateString()}">`
        : `<u style="text-decoration-color:#6366f1;text-underline-offset:6px;text-decoration-thickness:2px;cursor:pointer;" title="User Edit">`;
      const tagClose = isAI ? '</mark>' : '</u>';
      if (rendered.includes(upd.segmentId)) {
        rendered = rendered.replace(new RegExp(upd.segmentId, 'g'), `${tagOpen}${upd.content}${tagClose}`);
      }
    });

    if (context) {
      if (context.cognition === 'high') {
        rendered = rendered.replace(/Problem:/g, '<strong style="color:#6366f1;letter-spacing:0.05em;">SYSTEMIC ARCHITECTURAL CHALLENGE:</strong>');
      }
      if (context.cognition === 'visual' || context.health === 'recovering') {
        rendered = rendered.replace(/\./g, '. <br>• ');
      }
      if (context.age > 60) {
        rendered = `<div style="font-size:1.25rem;line-height:1.8;color:#f8fafc;">${rendered}</div>`;
      } else if (context.age < 18) {
        rendered = `<div style="font-size:1.1rem;line-height:1.5;color:#e2e8f0;">${rendered}</div>`;
      }
    }
    return rendered;
  }
}

// ── CREATE SURFACE ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class Create implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly claudeService = inject(ClaudeService);
  private readonly toast = inject(ToastService);
  private readonly destroy$ = new Subject<void>();
  private _isExistingDraft = false;
  private _loadedIdentity = { title: '', contentTitle: '' };

  // ── Sync State ─────────────────────────────────────────────────────────────
  readonly syncStatus = signal<'synced' | 'saving' | 'error'>('synced');
  readonly isLive = signal(true);

  // ── Identity ───────────────────────────────────────────────────────────────
  readonly baseId = signal('');
  readonly hybridId = signal('');

  // ── Content ────────────────────────────────────────────────────────────────
  readonly title = signal('');
  readonly subtitle = signal('');
  readonly contentType = signal<ContentType>('L');
  readonly domain = signal('education');
  readonly contentTitle = signal('');
  readonly contentState = signal<ContentState>('draft');
  readonly collaboratorIds = signal<string[]>([]);
  readonly blocks = signal<Block[]>([]);
  // ── Evolution ──────────────────────────────────────────────────────────────
  readonly userUpdates = signal<UpdateEntry[]>([]);
  readonly aiUpdates = signal<UpdateEntry[]>([]);
  readonly personalContext = signal<PersonalizationContext>({ age: 28, health: 'optimal', cognition: 'standard' });

  // ── Ideas & Updates ────────────────────────────────────────────────────────
  readonly ideasText = signal('');
  readonly ideasLoading = signal(false);
  readonly updateTab = signal<'creator' | 'ai'>('creator');
  readonly updateSegmentId = signal('');
  readonly updateContent = signal('');
  readonly aiUpdateLoading = signal(false);
  readonly aiUpdateResult = signal('');
  readonly isAdapted = signal(false);

  // Collaboration moved to external Share (CG) flow

  // ── UI ─────────────────────────────────────────────────────────────────────
  readonly activeModal = signal<string | null>(null);

  // ── Upload ─────────────────────────────────────────────────────────────────
  readonly uploadTab = signal<'file' | 'embed'>('file');
  readonly uploadFiles = signal<UploadFile[]>([]);
  readonly embedUrl = signal('');
  readonly isDragOver = signal(false);

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
  ];

  // ── Taxonomy Constants ─────────────────────────────────────────────────────



  readonly CATEGORY_META: Record<string, { color: string; template: BlockType[] }> = {
    course: { color: '#6366f1', template: ['text', 'code'] },
    research: { color: '#10b981', template: ['text', 'text'] },
    project: { color: '#f59e0b', template: ['text', 'code', 'image'] },
    webinar: { color: '#3b82f6', template: ['text', 'video'] },
    workshop: { color: '#8b5cf6', template: ['text', 'code', 'columns'] },
    entertainment: { color: '#ec4899', template: ['text', 'image'] },
    other: { color: '#6366f1', template: ['text'] },
  };

  readonly BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'text', label: 'Text', icon: '✍', desc: 'Atomic text segment' },
    { type: 'code', label: 'Code', icon: '⌨', desc: 'Code architecture' },
    { type: 'image', label: 'Image', icon: '📸', desc: 'Visual media' },
    { type: 'video', label: 'Video', icon: '🎬', desc: 'Motion content' },
    { type: 'audio', label: 'Audio', icon: '🎵', desc: 'Sonic data' },
    { type: 'divider', label: 'Divider', icon: '―', desc: 'Logical break' },
    { type: 'columns', label: 'Columns', icon: '▤', desc: 'Multi-column layout' },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly categoryAccentColor = computed(() => '#6366f1');

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('pageId');
    if (paramId) {
      this.baseId.set(paramId);
      this._loadFromServer(paramId);
    }
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const blockParam = params.get('block') as BlockType | null;
      if (blockParam && this.BLOCK_TYPES.some(bt => bt.type === blockParam)) {
        this.addBlock(blockParam);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Primary actions ────────────────────────────────────────────────────────

  save(): void {
    this.performAutosave();
  }

  update(segmentId: string, content: string): void {
    this.userUpdates.update(u => [...u, { segmentId, content, type: 'user', timestamp: new Date() }]);
    this.onFieldChange();
  }

  // toggleAdaptation removed to minimize state

  // ── Library ────────────────────────────────────────────────────────────────

  openLibrary(): void {
    this.router.navigate(['/personal/library']);
  }

  openIdeas(): void {
    this.ideasText.set('');
    this.activeModal.set('ideas');
    if (!this.title()) return;
    this.fetchIdeas();
  }

  fetchIdeas(): void {
    this.ideasLoading.set(true);
    this.claudeService.askCoTeacher({
      userMessage: `For the topic "${this.title()}" (content title: ${this.contentTitle() || 'general'}), share 5 recent research insights that would enrich this content. Numbered list, one concise paragraph each.`,
      contentContext: { title: this.title(), category: this.contentTitle() },
    }).subscribe({
      next: ({ data }) => {
        this.ideasText.set(data.reply);
        this.ideasLoading.set(false);
      },
      error: () => {
        this.ideasText.set('Unable to load ideas right now.');
        this.ideasLoading.set(false);
        this.toast.error('Failed to fetch ideas — please try again.');
      },
    });
  }

  applyCreatorUpdate(): void {
    const segId = this.updateSegmentId().trim();
    const content = this.updateContent().trim();
    if (!segId || !content) return;
    this.userUpdates.update(u => [...u, { segmentId: segId, content, type: 'user', timestamp: new Date() }]);
    this.isAdapted.set(true);
    this.updateSegmentId.set('');
    this.updateContent.set('');
    this.onFieldChange();
    this.toast.success('Update applied.');
    this.closeModal();
  }

  fetchAiUpdate(): void {
    if (!this.title()) return;
    this.aiUpdateLoading.set(true);
    this.aiUpdateResult.set('');
    const snippet = this.blocks()
      .filter(b => b.type === 'text')
      .map(b => (b.content['html'] as string) || '')
      .join(' ')
      .slice(0, 300);
    this.claudeService.askCoTeacher({
      userMessage: `For content titled "${this.title()}" — context: "${snippet}" — provide 3 research-backed updates. Each on one line: TARGET: [exact phrase to enhance] | UPDATE: [enriched replacement]`,
      contentContext: { title: this.title(), category: this.contentTitle() },
    }).subscribe({
      next: ({ data }) => {
        this.aiUpdateResult.set(data.reply);
        const parsed: UpdateEntry[] = data.reply
          .split('\n')
          .filter((l: string) => l.includes('TARGET:') && l.includes('UPDATE:'))
          .map((line: string) => ({
            segmentId: (line.match(/TARGET:\s*([^|]+)/)?.[1] ?? '').trim(),
            content: (line.match(/UPDATE:\s*(.+)/)?.[1] ?? '').trim(),
            type: 'ai' as const,
            timestamp: new Date(),
          }))
          .filter((u: UpdateEntry) => u.segmentId && u.content);
        if (parsed.length > 0) {
          this.aiUpdates.update(e => [...e, ...parsed]);
          this.isAdapted.set(true);
          this.onFieldChange();
          this.toast.success(`${parsed.length} AI update${parsed.length > 1 ? 's' : ''} applied.`);
        } else {
          this.toast.info('No matching segments found to update.');
        }
        this.aiUpdateLoading.set(false);
      },
      error: () => {
        this.aiUpdateLoading.set(false);
        this.toast.error('AI update failed — please try again.');
      },
    });
  }

  loadContent(id: string): void {
    this.baseId.set(id);
    this._loadFromServer(id);
    this.closeModal();
  }

  createNew(): void {
    this.baseId.set('');
    this.hybridId.set('');
    this.title.set('');
    this.subtitle.set('');
    this.blocks.set([]);
    this.contentTitle.set('');
    this.domain.set('education');
    this.contentType.set('L');
    this.contentState.set('draft');
    this.collaboratorIds.set([]);
    this.userUpdates.set([]);
    this.aiUpdates.set([]);
    this.syncStatus.set('synced');
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private performAutosave(): void {
    if (!this.title()) {
      this.toast.warning('Add a title before saving.');
      return;
    }
    this.syncStatus.set('saving');

    const apiBlocks: CreatorBlock[] = this.blocks().map(b => ({
      blockId: b.id,
      type: b.type as CreatorBlock['type'],
      content: b.content,
      order: b.order,
    }));

    const payload: DraftPayload = {
      title: this.title(),
      subtitle: this.subtitle(),
      contentType: this.contentType(),
      domain: this.domain(),
      contentTitle: this.contentTitle(),
      blocks: apiBlocks,
    };
    console.log('Saving payload:', payload);

    if (this.baseId()) {
      this.creatorService.updateDraft(this.baseId(), payload).subscribe({
        next: ({ data }) => {
          this.hybridId.set(data.hybridId);
          this.syncStatus.set('synced');
          this.toast.success('Draft saved.');
        },
        error: () => {
          this.syncStatus.set('error');
          this.toast.error('Save failed — please try again.');
        },
      });
    } else {
      this.creatorService.createDraft(payload).subscribe({
        next: ({ data }) => {
          this.baseId.set(data.baseId);
          this.hybridId.set(data.hybridId);
          this.syncStatus.set('synced');
          this.toast.success('Draft created.');
          this.router.navigate(['/personal/create', data.baseId], { replaceUrl: true });
        },
        error: () => {
          this.syncStatus.set('error');
          this.toast.error('Failed to create draft — please try again.');
        },
      });
    }
  }

  onFieldChange(): void { }

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

  removeBlock(id: string): void {
    this.blocks.update(b =>
      b.filter(block => block.id !== id).map((block, i) => ({ ...block, order: i }))
    );
    this.onFieldChange();
  }

  moveBlock(id: string, dir: 'up' | 'down'): void {
    const arr = [...this.blocks()];
    const idx = arr.findIndex(b => b.id === id);
    if (dir === 'up' && idx > 0) {
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    } else if (dir === 'down' && idx < arr.length - 1) {
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    } else return;
    arr.forEach((b, i) => b.order = i);
    this.blocks.set(arr);
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
      case 'image': return { src: '', alt: '', caption: '' };
      case 'video': return { src: '', caption: '' };
      case 'audio': return { src: '', title: '' };
      case 'divider': return { style: 'line' };
      case 'columns': return { left: '', right: '' };
    }
  }

  onIdentityChange(): void {
    this.onFieldChange();
    if (!this._isExistingDraft) return;

    const changed =
      this.title() !== this._loadedIdentity.title ||
      this.contentTitle() !== this._loadedIdentity.contentTitle;

    if (changed) {
      this._isExistingDraft = false;
      this._loadedIdentity = { title: '', contentTitle: '' };
      this.baseId.set('');
      this.hybridId.set('');
      this.blocks.set([]);
      this.contentState.set('draft');
      this.router.navigate(['/personal/create'], { replaceUrl: true });
    }
  }

  private _loadFromServer(baseId: string): void {
    this.syncStatus.set('saving');
    this.creatorService.getDraft(baseId).subscribe({
      next: ({ data }) => {
        this.toast.info('Draft loaded.');
        this.title.set(data.title);
        this.subtitle.set((data as any).subtitle ?? '');
        this.hybridId.set(data.hybridId);
        this.contentType.set(data.contentType);
        this.domain.set(data.domain);
        this.contentTitle.set(data.contentTitle ?? '');
        this.contentState.set(data.state);
        this._isExistingDraft = true;
        this._loadedIdentity = { title: data.title, contentTitle: data.contentTitle ?? '' };
        const rawBlocks = (data as unknown as Record<string, unknown>)['blocks'] as CreatorBlock[] | undefined;
        if (rawBlocks?.length) {
          this.blocks.set(rawBlocks.map(b => ({
            id: b.blockId,
            type: b.type as BlockType,
            content: b.content,
            order: b.order,
          })));
        }
        this.syncStatus.set('synced');
      },
      error: () => {
        this.syncStatus.set('error');
        this.toast.error('Failed to load draft.');
      },
    });
  }

  // Methods removed to minimize state: duplicate(), openCollaborate(), openPublish(), shareContent(), publishContent(), addCollaborator(), removeCollaborator()

  // ── Upload ─────────────────────────────────────────────────────────────────

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
      const url = this.embedUrl();
      if (!url) return;
      const type = this._detectEmbedType(url);
      this.blocks.update(b => [...b, {
        id: 'blk_' + Date.now(),
        type,
        content: type === 'audio'
          ? { src: url, title: '' }
          : type === 'image'
            ? { src: url, alt: '', caption: '' }
            : { src: url, caption: '' },
        order: b.length,
      }]);
      this.onFieldChange();
      this.closeModal();
      return;
    }
    const pending = this.uploadFiles().filter(f => f.status === 'pending');
    pending.forEach(f => {
      const blobUrl = URL.createObjectURL(f.file);
      this._simulateUpload(f.id, blobUrl);
    });
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

  private _detectEmbedType(url: string): BlockType {
    const lower = url.toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif|svg)/.test(lower)) return 'image';
    if (/\.(mp4|webm|ogg|mov)/.test(lower)) return 'video';
    if (/\.(mp3|wav|ogg|aac)/.test(lower)) return 'audio';
    return 'image';
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

  private _simulateUpload(fileId: string, blobUrl: string): void {
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
        const mt = file.mediaType;
        if (mt === 'image' || mt === 'video' || mt === 'audio') {
          const blockType: BlockType = mt;
          const content = mt === 'audio'
            ? { src: blobUrl, title: file.name }
            : mt === 'image'
              ? { src: blobUrl, alt: file.name, caption: '' }
              : { src: blobUrl, caption: '' };
          this.blocks.update(b => [...b, {
            id: 'blk_' + Date.now() + '_' + Math.random().toString(36).slice(2),
            type: blockType,
            content,
            order: b.length,
          }]);
          this.onFieldChange();
        }
        const allSettled = this.uploadFiles().every(f => f.status === 'done' || f.status === 'error');
        if (allSettled) setTimeout(() => this.closeModal(), 600);
      }
    }, 150);
  }

  private _patchFile(id: string, patch: Partial<UploadFile>): void {
    this.uploadFiles.update(list => list.map(f => f.id === id ? { ...f, ...patch } : f));
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  closeModal(): void {
    this.activeModal.set(null);
    this.uploadFiles.set([]);
    this.uploadTab.set('file');
    this.embedUrl.set('');
    this.isDragOver.set(false);
    this.updateTab.set('creator');
    this.updateSegmentId.set('');
    this.updateContent.set('');
    this.aiUpdateResult.set('');
  }
}
