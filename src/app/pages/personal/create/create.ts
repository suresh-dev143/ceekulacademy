import { Component, signal, computed, inject, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorService, ContentType, ContentState, CreatorBlock, DraftPayload, DraftSummary } from '../../../services/creator.service';
import { SemanticGovernanceService, GovernanceDecision } from '../../../services/semantic-governance.service';
import { ClaudeService } from '../../../services/claude.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreatorToolsService } from '../../../services/creator-tools.service';
import { MediaUploadService } from '../../../services/media-upload/media-upload.service';
import { ToastComponent } from '../../../components/toast/toast';
import { DiscussionChatComponent } from '../../../components/discussion-chat/discussion-chat';
import { Subject, takeUntil, debounceTime, switchMap } from 'rxjs';

// ── Types ───────────────────────────────────────────────────────────────────

export type BlockType =
  | 'text' | 'subtitle' | 'code'
  | 'image' | 'video' | 'audio' | 'animation'
  | 'divider' | 'columns' | 'canvas' | 'ideas';

export type CellToolType = 'text' | 'image' | 'video' | 'audio' | 'animation';

export interface CanvasCell {
  id: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  tool: CellToolType;
  content: Record<string, unknown>;
}

export interface BlockStyle {
  bg?: string;
  padding?: string;
  borderRadius?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: string;
  opacity?: number;
}

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

// ── Library types ───────────────────────────────────────────────────────────

interface LibrarySection {
  subtitle: string;
  sectionIndex: number;
  items: DraftSummary[];
}

interface LibraryProgram {
  title: string;
  sections: LibrarySection[];
}

// ── Layer 1: Local Semantic Snapshot ─────────────────────────────────────────
// Crash-resistant, offline-first, bandwidth-independent local draft.
// Written to IndexedDB on every semantic perturbation — silently, no server.

interface LocalSemanticSnapshot {
  sessionKey:   string;
  baseId:       string;
  hybridId:     string;
  title:        string;
  subtitle:     string;
  contentType:  string;
  domain:       string;
  contentTitle: string;
  blocks:       Block[];
  blockStyles:  Record<string, BlockStyle>;
  snapshotAt:   number;
}

class LocalDraftEngine {
  private static readonly DB   = 'ceekul-semantic-drafts';
  private static readonly STORE = 'snapshots';
  private _db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((res, rej) => {
      const req = indexedDB.open(LocalDraftEngine.DB, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(LocalDraftEngine.STORE))
          db.createObjectStore(LocalDraftEngine.STORE, { keyPath: 'sessionKey' });
      };
      req.onsuccess = (e) => { this._db = (e.target as IDBOpenDBRequest).result; res(); };
      req.onerror   = () => rej(req.error);
    });
  }

  async snapshot(data: LocalSemanticSnapshot): Promise<void> {
    if (!this._db) return;
    return new Promise((res, rej) => {
      const store = this._db!.transaction(LocalDraftEngine.STORE, 'readwrite')
                              .objectStore(LocalDraftEngine.STORE);
      const req = store.put(data);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  }

  async load(sessionKey: string): Promise<LocalSemanticSnapshot | null> {
    if (!this._db) return null;
    return new Promise((res, rej) => {
      const req = this._db!.transaction(LocalDraftEngine.STORE, 'readonly')
                            .objectStore(LocalDraftEngine.STORE).get(sessionKey);
      req.onsuccess = () => res((req.result as LocalSemanticSnapshot) ?? null);
      req.onerror   = () => rej(req.error);
    });
  }

  async listAll(): Promise<LocalSemanticSnapshot[]> {
    if (!this._db) return [];
    return new Promise((res, rej) => {
      const req = this._db!.transaction(LocalDraftEngine.STORE, 'readonly')
                            .objectStore(LocalDraftEngine.STORE).getAll();
      req.onsuccess = () => res(req.result ?? []);
      req.onerror   = () => rej(req.error);
    });
  }

  async clear(sessionKey: string): Promise<void> {
    if (!this._db) return;
    return new Promise((res, rej) => {
      const req = this._db!.transaction(LocalDraftEngine.STORE, 'readwrite')
                            .objectStore(LocalDraftEngine.STORE).delete(sessionKey);
      req.onsuccess = () => res();
      req.onerror   = () => rej(req.error);
    });
  }
}

// ── CREATE SURFACE ──────────────────────────────────────────────────────────

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, ToastComponent, DiscussionChatComponent],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class Create implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly claudeService = inject(ClaudeService);
  private readonly toast = inject(ToastService);
  private readonly creatorTools = inject(CreatorToolsService);
  private readonly mediaUploadService = inject(MediaUploadService);
  private readonly governanceSvc = inject(SemanticGovernanceService);
  private readonly destroy$ = new Subject<void>();
  private _isExistingDraft = false;
  private _loadedIdentity = { title: '', contentTitle: '' };

  // ── Governance state (Layer 4 — publish-time semantic governance) ──────────
  readonly governanceDecision = signal<GovernanceDecision | null>(null);
  readonly governanceReason   = signal<string>('');
  readonly governanceProvisional = signal(false);
  readonly governanceFlags    = signal<string[]>([]);

  // ── Three-layer save state ─────────────────────────────────────────────────
  // Layer 1 — Local draft (IndexedDB, silent, crash-resistant)
  readonly localDraftState  = signal<'clean' | 'dirty' | 'snapshotted'>('clean');
  // Layer 2 — Server sync (private cloud draft, explicit)
  readonly serverSyncState  = signal<'unsynced' | 'saving' | 'saved' | 'error'>('unsynced');
  // Derived compat alias used by existing HTML
  readonly syncStatus = computed((): 'synced' | 'saving' | 'error' => {
    const s = this.serverSyncState();
    if (s === 'saving') return 'saving';
    if (s === 'error')  return 'error';
    return 'synced';
  });
  readonly isLive = signal(true);

  // ── Local draft engine (Layer 1) ───────────────────────────────────────────
  private readonly _engine = new LocalDraftEngine();
  private _sessionKey = '';

  // ── Recovery state ─────────────────────────────────────────────────────────
  readonly showRecoveryBanner  = signal(false);
  readonly recoveredSnapshot   = signal<LocalSemanticSnapshot | null>(null);

  // ── Identity ───────────────────────────────────────────────────────────────
  readonly baseId = signal('');
  readonly hybridId = signal('');
  readonly ucrsLinkCopied = signal(false);

  // ── Content ────────────────────────────────────────────────────────────────
  readonly title = signal('');
  readonly subtitle = signal('');
  readonly contentType = signal<ContentType>('L');
  readonly domain = signal('Course');
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

  // ── Library ─────────────────────────────────────────────────────────────────
  readonly libraryOpen = signal(true);
  readonly libraryItems = signal<DraftSummary[]>([]);
  readonly libraryLoading = signal(false);
  private readonly _fieldChange$ = new Subject<void>();

  readonly libraryGrouped = computed((): LibraryProgram[] => {
    const items = this.libraryItems();
    const programMap = new Map<string, Map<string, DraftSummary[]>>();
    for (const item of items) {
      const prog = item.title || '(No Program)';
      const sect = item.subtitle || '';
      if (!programMap.has(prog)) programMap.set(prog, new Map());
      const sects = programMap.get(prog)!;
      if (!sects.has(sect)) sects.set(sect, []);
      sects.get(sect)!.push(item);
    }
    return Array.from(programMap.entries()).map(([title, sects]) => ({
      title,
      sections: Array.from(sects.entries()).map(([subtitle, sItems], idx) => ({
        subtitle,
        sectionIndex: idx + 1,
        items: [...sItems].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      })),
    }));
  });

  // ── UI ─────────────────────────────────────────────────────────────────────
  readonly activeModal = signal<string | null>(null);
  readonly rightPanel = signal<'conceive' | 'ideas' | 'update' | null>(null);
  readonly toolsPanelOpen = signal(true);

  // ── Left Semantic Memory Panel ─────────────────────────────────────────────
  readonly activeLibSection = signal<string>('drafted');
  readonly semanticFilter   = signal<string | null>(null);
  readonly importUrl        = signal('');

  readonly LIB_SECTIONS = [
    { key: 'drafted',   label: 'Drafted'   },
    { key: 'published', label: 'Published' },
    { key: 'updated',   label: 'Updated'   },
    { key: 'archived',  label: 'Archived'  },
    { key: 'shared',    label: 'Shared'    },
  ] as const;

  readonly SEMANTIC_FILTERS = [
    'lecture','poetry','film','advertisement','research',
    'governance','education','music','wellness','animation',
    'agriculture','science','philosophy','workshop','multilingual',
  ];

  readonly CATEGORIES = [
    'Course',
    'workshop',
    'webinar',
    'research',
    'project',
    'advertisement',
    'other',
  ] as const;

  // ── Insert at Position ─────────────────────────────────────────────────────
  readonly insertTargetId = signal<string | null>(null);

  // ── Block Styles ───────────────────────────────────────────────────────────
  readonly blockStyles = signal<Record<string, BlockStyle>>({});
  readonly styleEditorBlockId = signal<string | null>(null);

  // ── Canvas ─────────────────────────────────────────────────────────────────
  readonly cellPickerBlockId = signal<string | null>(null);
  readonly newCellConfig = signal<{ col: number; row: number; colSpan: number; rowSpan: number; tool: CellToolType }>({
    col: 1, row: 1, colSpan: 6, rowSpan: 2, tool: 'image',
  });

  // ── Upload ─────────────────────────────────────────────────────────────────
  readonly uploadTab = signal<'file' | 'embed'>('file');
  readonly uploadFiles = signal<UploadFile[]>([]);
  readonly embedUrl = signal('');
  readonly isDragOver = signal(false);
  readonly uploadTarget = signal<{ blockId: string; cellId?: string } | null>(null);

  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  private readonly ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm',
    'audio/mpeg', 'audio/wav',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json',
  ];

  // ── Constants ──────────────────────────────────────────────────────────────

  readonly CATEGORY_META: Record<string, { color: string; template: BlockType[] }> = {
    course:        { color: '#6366f1', template: ['text', 'code'] },
    research:      { color: '#10b981', template: ['text', 'text'] },
    project:       { color: '#f59e0b', template: ['text', 'code', 'image'] },
    webinar:       { color: '#3b82f6', template: ['text', 'video'] },
    workshop:      { color: '#8b5cf6', template: ['text', 'code', 'columns'] },
    entertainment: { color: '#ec4899', template: ['text', 'image'] },
    other:         { color: '#6366f1', template: ['text'] },
  };

  readonly BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'text',      label: 'Text',      icon: '✍',  desc: 'Atomic text segment' },
    { type: 'subtitle',  label: 'Subtitle',  icon: 'H₂', desc: 'Section heading' },
    { type: 'code',      label: 'Code',      icon: '⌨',  desc: 'Code architecture' },
    { type: 'image',     label: 'Image',     icon: '📸', desc: 'Visual media' },
    { type: 'video',     label: 'Video',     icon: '🎬', desc: 'Motion content' },
    { type: 'audio',     label: 'Audio',     icon: '🎵', desc: 'Sonic data' },
    { type: 'animation', label: 'Animation', icon: '✨', desc: 'Lottie / motion' },
    { type: 'canvas',    label: 'Canvas',    icon: '⊞',  desc: 'Multimedia partition grid' },
    { type: 'divider',   label: 'Divider',   icon: '―',  desc: 'Logical break' },
    { type: 'columns',   label: 'Columns',   icon: '▤',  desc: 'Multi-column layout' },
    { type: 'ideas',     label: 'Ideas',     icon: '💡', desc: 'AI research insights' },
  ];

  readonly cellTools: { type: CellToolType; label: string; icon: string }[] = [
    { type: 'text',      label: 'Text',      icon: '✍' },
    { type: 'image',     label: 'Image',     icon: '📸' },
    { type: 'video',     label: 'Video',     icon: '🎬' },
    { type: 'audio',     label: 'Audio',     icon: '🎵' },
    { type: 'animation', label: 'Animation', icon: '✨' },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly categoryAccentColor = computed(() => '#6366f1');

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('pageId');

    // Open local engine, then set session key and check for orphaned recovery drafts
    this._engine.open().then(() => {
      if (paramId) {
        this._sessionKey = `session_${paramId}`;
      } else {
        this._sessionKey = `new_${Date.now()}`;
        this._checkRecovery();
      }
    }).catch(() => {
      this._sessionKey = paramId ? `session_${paramId}` : `new_${Date.now()}`;
    });

    if (paramId) {
      this.baseId.set(paramId);
      this._loadFromServer(paramId);
    }
    const qp = this.route.snapshot.queryParamMap;
    const pt = qp.get('programTitle');
    const st = qp.get('sectionTitle');
    const ct = qp.get('contentTitle');
    if (pt && !this.title())        this.title.set(pt);
    if (st && !this.subtitle())     this.subtitle.set(st);
    if (ct && !this.contentTitle()) this.contentTitle.set(ct);

    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const blockParam = params.get('block') as BlockType | null;
      if (blockParam && this.BLOCK_TYPES.some(bt => bt.type === blockParam)) {
        this.addBlock(blockParam);
      }
    });

    // Layer 1: local snapshot on every semantic perturbation (silent, no server)
    this._fieldChange$.pipe(
      debounceTime(800),
      takeUntil(this.destroy$),
    ).subscribe(() => { this._snapshotLocal(); });

    this.refreshLibrary();

    // Sync canvas session state to shared right-panel service
    this.creatorTools.hasActiveCanvas.set(true);
    this.creatorTools.sessionTitle.set(this.title());
    this.creatorTools.sessionContentTitle.set(this.contentTitle());

    // Apply updates emitted from the right-panel tools
    this.creatorTools.applyUpdate$.pipe(takeUntil(this.destroy$)).subscribe(({ segmentId, replacement }) => {
      this.userUpdates.update(u => [...u, { segmentId, content: replacement, type: 'user', timestamp: new Date() }]);
      this.isAdapted.set(true);
      this.onFieldChange();
      this.toast.success('Update applied.');
    });
  }

  ngOnDestroy(): void {
    // Final local snapshot before the component is torn down
    this._snapshotLocal();
    this.creatorTools.hasActiveCanvas.set(false);
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Primary actions ────────────────────────────────────────────────────────

  // Layer 2: Save Draft — explicit, private cloud sync, editable, lineage-preserving
  save(): void { this.saveDraft(); }

  saveDraft(): void {
    if (!this.title()) { this.toast.warning('Add a title before saving.'); return; }
    if (this._hasBlobUrls()) {
      this.toast.warning('Re-upload temporary media before saving.');
      return;
    }
    this.serverSyncState.set('saving');
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
    console.log('Saving draft with payload:', payload);
    if (this.baseId()) {
      this.creatorService.updateDraft(this.baseId(), payload).subscribe({
        next: ({ data }) => {
          this.hybridId.set(data.hybridId);
          this.serverSyncState.set('saved');
          this.localDraftState.set('clean');
          this.toast.success('Draft saved.');
          this.refreshLibrary();
          this._engine.clear(this._sessionKey).catch(() => {});
        },
        error: () => {
          this.serverSyncState.set('error');
          this.toast.error('Save failed — local draft preserved.');
        },
      });
    } else {
      this.creatorService.createDraft(payload).subscribe({
        next: ({ data }) => {
          this.baseId.set(data.baseId);
          this.hybridId.set(data.hybridId);
          this.serverSyncState.set('saved');
          this.localDraftState.set('clean');
          this.toast.success('Draft created.');
          this.router.navigate(['/personal/create', data.baseId], { replaceUrl: true });
          this._sessionKey = `session_${data.baseId}`;
          this._engine.clear(this._sessionKey).catch(() => {});
          this.refreshLibrary();
        },
        error: () => {
          this.serverSyncState.set('error');
          this.toast.error('Failed to create draft — local draft preserved.');
        },
      });
    }
  }

  // Layer 3: Publish — semantic governance then public commit
  publishContent(): void {
    if (!this.title()) { this.toast.warning('Add a title before publishing.'); return; }
    if (!this.baseId()) {
      this.toast.info('Save a draft first to generate the semantic identity.');
      return;
    }
    this.serverSyncState.set('saving');
    this.governanceDecision.set(null);
    this.governanceReason.set('');
    this.governanceFlags.set([]);

    this.creatorService.publish(this.baseId()).subscribe({
      next: (res: any) => {
        const data = res.data ?? res;
        this.contentState.set('published');
        this.hybridId.set(data.hybridId);
        this.serverSyncState.set('saved');
        this.localDraftState.set('clean');
        this._engine.clear(this._sessionKey).catch(() => {});
        this.refreshLibrary();

        // Surface governance result to UI
        const gov = res.governance;
        if (gov) {
          this.governanceDecision.set(gov.decision ?? 'approved');
          this.governanceReason.set(gov.reason ?? '');
          this.governanceProvisional.set(gov.provisional ?? false);
          this.governanceFlags.set(gov.flags ?? []);

          if (gov.decision === 'pending_human_review') {
            this.toast.warning('Published — content is under semantic review. It will be visible once approved.');
          } else if (gov.flags?.length) {
            this.toast.success('Published — note: some content flags were raised and are being reviewed.');
          } else {
            this.toast.success('Published — now discoverable by members.');
          }
        } else {
          this.toast.success('Published — now discoverable by members.');
        }
      },
      error: (err: any) => {
        this.serverSyncState.set('error');
        // governance_rejected is a semantic governance rejection (422)
        if (err?.code === 'VALIDATION_ERROR' || err?.message?.includes('governance')) {
          const reason = err?.message ?? 'Content could not be published.';
          this.governanceDecision.set('rejected');
          this.governanceReason.set(reason);
          this.toast.error(`Publish blocked: ${reason}`);
        } else {
          this.toast.error(err?.message ?? 'Publish failed — please try again.');
        }
      },
    });
  }

  // Layer 3 (version): Update — syncs blocks then republishes, appends semantic lineage
  republishContent(): void {
    if (!this.title()) { this.toast.warning('Add a title before updating.'); return; }
    if (!this.baseId()) return;
    if (this._hasBlobUrls()) {
      this.toast.warning('@ warning Re-upload temporary media before updating.');
      return;
    }
    this.serverSyncState.set('saving');
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
    this.creatorService.updateDraft(this.baseId(), payload).pipe(
      switchMap(() => this.creatorService.republish(this.baseId()))
    ).subscribe({
      next: ({ data }) => {
        this.hybridId.set(data.hybridId);
        this.contentState.set('published');
        this.serverSyncState.set('saved');
        this.localDraftState.set('clean');
        this._engine.clear(this._sessionKey).catch(() => {});
        this.toast.success('New version published — semantic lineage updated.');
        this.refreshLibrary();
      },
      error: () => {
        this.serverSyncState.set('error');
        this.toast.error('Update failed — local draft preserved.');
      },
    });
  }

  update(segmentId: string, content: string): void {
    this.userUpdates.update(u => [...u, { segmentId, content, type: 'user', timestamp: new Date() }]);
    this.onFieldChange();
  }

  openLibrary(): void {
    this.router.navigate(['/personal/library']);
  }

  openIdeas(): void {
    this.ideasText.set('');
    this.activeModal.set('ideas');
    if (!this.title()) return;
    this.fetchIdeas();
  }

  toggleRightPanel(panel: 'conceive' | 'ideas' | 'update'): void {
    if (this.rightPanel() === panel) { this.rightPanel.set(null); return; }
    this.rightPanel.set(panel);
    if (panel === 'ideas' && this.title() && !this.ideasText()) this.fetchIdeas();
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

  // ── Ideas block (inline AI research panel) ────────────────────────────────
  readonly ideasLoadingBlocks = signal<Set<string>>(new Set());

  fetchBlockIdeas(blockId: string): void {
    if (!this.title()) { this.toast.warning('Add a Program Title first.'); return; }
    this.ideasLoadingBlocks.update(s => new Set([...s, blockId]));
    this.claudeService.askCoTeacher({
      userMessage: `For "${this.title()}"${this.contentTitle() ? ' (content: ' + this.contentTitle() + ')' : ''}, provide 5 research insights as a numbered list, one concise paragraph each.`,
      contentContext: { title: this.title(), category: this.contentTitle() },
    }).subscribe({
      next: ({ data }) => {
        this._patchBlock(blockId, b => ({ ...b, content: { ...b.content, ideasText: data.reply, fetched: true } }));
        this.ideasLoadingBlocks.update(s => { const n = new Set(s); n.delete(blockId); return n; });
        this.onFieldChange();
      },
      error: () => {
        this._patchBlock(blockId, b => ({ ...b, content: { ...b.content, ideasText: 'Failed to fetch ideas.' } }));
        this.ideasLoadingBlocks.update(s => { const n = new Set(s); n.delete(blockId); return n; });
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
    this.domain.set('Course');
    this.contentType.set('L');
    this.contentState.set('draft');
    this.collaboratorIds.set([]);
    this.userUpdates.set([]);
    this.aiUpdates.set([]);
    this.blockStyles.set({});
    this.serverSyncState.set('unsynced');
    this.localDraftState.set('clean');
  }

  // ── Block operations ───────────────────────────────────────────────────────

  addBlock(type: BlockType, afterId?: string | null): void {
    const block: Block = {
      id: 'blk_' + Date.now(),
      type,
      content: this._defaultContent(type),
      order: 0,
    };
    this.blocks.update(current => {
      const list = [...current];
      if (afterId) {
        const idx = list.findIndex(b => b.id === afterId);
        if (idx !== -1) {
          list.splice(idx + 1, 0, block);
          return list.map((b, i) => ({ ...b, order: i }));
        }
      }
      return [...list, block].map((b, i) => ({ ...b, order: i }));
    });
    this.insertTargetId.set(null);
    this.activeModal.set(null);
    this.onFieldChange();
  }

  removeBlock(id: string): void {
    this.blocks.update(b =>
      b.filter(block => block.id !== id).map((block, i) => ({ ...block, order: i }))
    );
    this.blockStyles.update(m => {
      const next = { ...m };
      delete next[id];
      return next;
    });
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

  // ── Canvas operations ──────────────────────────────────────────────────────

  openAddCell(blockId: string): void {
    this.cellPickerBlockId.set(blockId);
    this.newCellConfig.set({ col: 1, row: 1, colSpan: 6, rowSpan: 2, tool: 'image' });
    this.activeModal.set('cell-picker');
  }

  confirmAddCell(): void {
    const blockId = this.cellPickerBlockId();
    if (!blockId) return;
    const cfg = this.newCellConfig();
    const cell: CanvasCell = {
      id: 'cell_' + Date.now(),
      col: cfg.col,
      row: cfg.row,
      colSpan: cfg.colSpan,
      rowSpan: cfg.rowSpan,
      tool: cfg.tool,
      content: this._defaultCellContent(cfg.tool),
    };
    this._patchBlock(blockId, b => {
      const cells = [...((b.content['cells'] as CanvasCell[]) || []), cell];
      return { ...b, content: { ...b.content, cells } };
    });
    this.cellPickerBlockId.set(null);
    this.activeModal.set(null);
  }

  updateCanvasCell(blockId: string, cellId: string, patch: Partial<CanvasCell>): void {
    this._patchBlock(blockId, b => {
      const cells = ((b.content['cells'] as CanvasCell[]) || []).map(c => {
        if (c.id !== cellId) return c;
        return {
          ...c,
          ...patch,
          content: patch.content ? { ...c.content, ...patch.content } : c.content,
        };
      });
      return { ...b, content: { ...b.content, cells } };
    });
  }

  removeCanvasCell(blockId: string, cellId: string): void {
    this._patchBlock(blockId, b => {
      const cells = ((b.content['cells'] as CanvasCell[]) || []).filter(c => c.id !== cellId);
      return { ...b, content: { ...b.content, cells } };
    });
  }

  openCellUpload(blockId: string, cellId: string): void {
    this.uploadTarget.set({ blockId, cellId });
    this.activeModal.set('upload');
  }

  getCanvasCells(block: Block): CanvasCell[] {
    return (block.content['cells'] as CanvasCell[]) || [];
  }

  cellGridStyle(cell: CanvasCell): Record<string, string> {
    return {
      'grid-column': `${cell.col} / span ${cell.colSpan}`,
      'grid-row': `${cell.row} / span ${cell.rowSpan}`,
    };
  }

  // ── Block styles ───────────────────────────────────────────────────────────

  toggleStyleEditor(blockId: string): void {
    this.styleEditorBlockId.update(id => id === blockId ? null : blockId);
  }

  setBlockStyle(blockId: string, patch: Partial<BlockStyle>): void {
    this.blockStyles.update(m => ({ ...m, [blockId]: { ...(m[blockId] || {}), ...patch } }));
  }

  getBlockStyle(blockId: string): BlockStyle {
    return this.blockStyles()[blockId] || {};
  }

  blockStyleToCSS(blockId: string): Record<string, string> {
    const s = this.getBlockStyle(blockId);
    const css: Record<string, string> = {};
    if (s.bg) css['background'] = s.bg;
    if (s.padding) css['padding'] = s.padding;
    if (s.borderRadius) css['borderRadius'] = s.borderRadius;
    if (s.align) css['textAlign'] = s.align;
    if (s.fontSize) css['fontSize'] = s.fontSize;
    if (s.opacity !== undefined) css['opacity'] = String(s.opacity);
    return css;
  }

  formatOpacity(v: number | undefined): string {
    return Math.round((v ?? 1) * 100) + '%';
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  onFieldChange(): void {
    this.localDraftState.set('dirty');
    this._fieldChange$.next();
    this.creatorTools.sessionTitle.set(this.title());
    this.creatorTools.sessionContentTitle.set(this.contentTitle());
  }

  // Layer 1: Write a local semantic snapshot to IndexedDB — silent, no server
  private _snapshotLocal(): void {
    if (!this._sessionKey) return;
    const snapshot: LocalSemanticSnapshot = {
      sessionKey:   this._sessionKey,
      baseId:       this.baseId(),
      hybridId:     this.hybridId(),
      title:        this.title(),
      subtitle:     this.subtitle(),
      contentType:  this.contentType(),
      domain:       this.domain(),
      contentTitle: this.contentTitle(),
      blocks:       this.blocks(),
      blockStyles:  this.blockStyles(),
      snapshotAt:   Date.now(),
    };
    this._engine.snapshot(snapshot).then(() => {
      if (this.localDraftState() === 'dirty') this.localDraftState.set('snapshotted');
    }).catch(() => {});
  }

  // Recovery: scan IndexedDB for any orphaned session from a previous crash/close
  private async _checkRecovery(): Promise<void> {
    const all = await this._engine.listAll().catch(() => [] as LocalSemanticSnapshot[]);
    const orphan = all.find(s => s.sessionKey !== this._sessionKey && s.title?.trim());
    if (orphan) {
      this.recoveredSnapshot.set(orphan);
      this.showRecoveryBanner.set(true);
    }
  }

  restoreRecoveredDraft(): void {
    const snap = this.recoveredSnapshot();
    if (!snap) return;
    this.title.set(snap.title);
    this.subtitle.set(snap.subtitle);
    this.contentType.set(snap.contentType as ContentType);
    this.domain.set(snap.domain);
    this.contentTitle.set(snap.contentTitle);
    this.blocks.set(snap.blocks);
    this.blockStyles.set(snap.blockStyles);
    if (snap.baseId)   this.baseId.set(snap.baseId);
    if (snap.hybridId) this.hybridId.set(snap.hybridId);
    this._sessionKey = snap.sessionKey;
    this.localDraftState.set('snapshotted');
    this.serverSyncState.set('unsynced');
    this.showRecoveryBanner.set(false);
    this.recoveredSnapshot.set(null);
    this.toast.success('Unfinished session restored.');
  }

  dismissRecoveredDraft(): void {
    const snap = this.recoveredSnapshot();
    if (snap) this._engine.clear(snap.sessionKey).catch(() => {});
    this.showRecoveryBanner.set(false);
    this.recoveredSnapshot.set(null);
  }

  copyUcrsLink(): void {
    if (!this.hybridId()) return;
    navigator.clipboard.writeText(this.hybridId()).catch(() => {});
    this.ucrsLinkCopied.set(true);
    setTimeout(() => this.ucrsLinkCopied.set(false), 2000);
  }

  navigateToCampaign(): void {
    this.router.navigate(['/personal/schedule'], {
      queryParams: { category: 'advertisement', ucrsLink: this.hybridId() },
    });
  }

  toggleLibrary(): void {
    this.libraryOpen.update(v => !v);
    if (this.libraryOpen()) this.refreshLibrary();
  }

  refreshLibrary(): void {
    this.libraryLoading.set(true);
    this.creatorService.listDrafts().subscribe({
      next: ({ data }) => { this.libraryItems.set(data); this.libraryLoading.set(false); },
      error: () => this.libraryLoading.set(false),
    });
  }

  libBadge(item: DraftSummary): 'DRAFT' | 'SAVED' | 'UPDATED' {
    if (item.version > 1) return 'UPDATED';
    if (item.state === 'draft') return 'DRAFT';
    return 'SAVED';
  }

  deleteVersion(baseId: string): void {
    this.creatorService.deleteDraft(baseId).subscribe({
      next: () => {
        if (this.baseId() === baseId) this.createNew();
        this.refreshLibrary();
        this.toast.success('Content deleted.');
      },
      error: () => this.toast.error('Delete failed.'),
    });
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
    this.serverSyncState.set('saving');
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
        this.serverSyncState.set('saved');
        this.localDraftState.set('clean');
        this.creatorTools.sessionTitle.set(data.title);
        this.creatorTools.sessionContentTitle.set(data.contentTitle ?? '');
      },
      error: () => {
        this.serverSyncState.set('error');
        this.toast.error('Failed to load draft.');
      },
    });
  }

  private _defaultContent(type: BlockType): Record<string, unknown> {
    switch (type) {
      case 'text':      return { html: '' };
      case 'subtitle':  return { text: '' };
      case 'code':      return { code: '', language: 'javascript' };
      case 'image':     return { src: '', alt: '', caption: '' };
      case 'video':     return { src: '', caption: '' };
      case 'audio':     return { src: '', title: '' };
      case 'animation': return { src: '', caption: '' };
      case 'divider':   return { style: 'line' };
      case 'columns':   return { left: '', right: '' };
      case 'canvas':    return { cols: 12, rowHeight: 80, cells: [] };
      case 'ideas':     return { ideasText: '', fetched: false };
    }
  }

  private _defaultCellContent(tool: CellToolType): Record<string, unknown> {
    switch (tool) {
      case 'text':      return { text: '' };
      case 'image':     return { src: '', alt: '', caption: '' };
      case 'video':     return { src: '', caption: '' };
      case 'audio':     return { src: '', title: '' };
      case 'animation': return { src: '', caption: '' };
    }
  }

  private _patchBlock(blockId: string, fn: (b: Block) => Block): void {
    this.blocks.update(list => list.map(b => b.id === blockId ? fn(b) : b));
    this.onFieldChange();
  }

  private _hasBlobUrls(): boolean {
    return this.blocks().some(b => {
      const src = b.content['src'] as string | undefined;
      if (src?.startsWith('blob:')) return true;
      if (b.type === 'canvas') {
        return ((b.content['cells'] as CanvasCell[]) || []).some(c => {
          const cs = c.content['src'] as string | undefined;
          return !!cs?.startsWith('blob:');
        });
      }
      return false;
    });
  }

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
    const target = this.uploadTarget();

    if (this.uploadTab() === 'embed') {
      const url = this.embedUrl();
      if (!url) return;
      if (target?.cellId) {
        this.updateCanvasCell(target.blockId, target.cellId, { content: { src: url, caption: '' } });
      } else {
        const type = this._detectEmbedType(url);
        const afterId = this.insertTargetId();
        const newBlock: Block = {
          id: 'blk_' + Date.now(),
          type,
          content: type === 'audio'
            ? { src: url, title: '' }
            : type === 'image'
              ? { src: url, alt: '', caption: '' }
              : { src: url, caption: '' },
          order: 0,
        };
        this.blocks.update(list => {
          if (afterId) {
            const idx = list.findIndex(b => b.id === afterId);
            if (idx !== -1) {
              const next = [...list];
              next.splice(idx + 1, 0, newBlock);
              return next.map((b, i) => ({ ...b, order: i }));
            }
          }
          return [...list, newBlock].map((b, i) => ({ ...b, order: i }));
        });
        this.onFieldChange();
      }
      this.closeModal();
      return;
    }

    const pending = this.uploadFiles().filter(f => f.status === 'pending');
    pending.forEach(f => {
      this._performUpload(f.id, target);
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
    if (/\.json/.test(lower)) return 'animation';
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

  private _performUpload(
    fileId: string,
    target: { blockId: string; cellId?: string } | null,
  ): void {
    const file = this.uploadFiles().find(f => f.id === fileId);
    if (!file) return;

    this._patchFile(fileId, { status: 'uploading', progress: 0 });

    const nativeFile = file.file;
    const mediaType = file.mediaType;

    let upload$;
    const options = {
      onProgress: (p: any) => {
        this._patchFile(fileId, { progress: p.percentage });
      }
    };

    if (mediaType === 'image') {
      upload$ = this.mediaUploadService.uploadImage(nativeFile, options);
    } else if (mediaType === 'video') {
      upload$ = this.mediaUploadService.uploadVideo(nativeFile, options);
    } else if (mediaType === 'audio') {
      upload$ = this.mediaUploadService.uploadAudio(nativeFile, options);
    } else if (mediaType === 'document' || mediaType === 'animation') {
      upload$ = this.mediaUploadService.uploadDocument(nativeFile, options);
    } else {
      this._patchFile(fileId, { status: 'error', error: 'Unsupported format' });
      return;
    }

    upload$.subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const remoteUrl = response.data.url;
          this._patchFile(fileId, { status: 'done', progress: 100 });

          if (target?.cellId) {
            this.updateCanvasCell(target.blockId, target.cellId, {
              content: { src: remoteUrl, alt: file.name, caption: file.name },
            });
          } else {
            if (mediaType === 'image' || mediaType === 'video' || mediaType === 'audio' || mediaType === 'animation') {
              const blockType: BlockType = mediaType;
              const content = mediaType === 'audio'
                ? { src: remoteUrl, title: file.name }
                : mediaType === 'animation'
                  ? { src: remoteUrl, caption: file.name }
                  : mediaType === 'image'
                    ? { src: remoteUrl, alt: file.name, caption: '' }
                    : { src: remoteUrl, caption: '' };
              const afterId = this.insertTargetId();
              this.blocks.update(list => {
                const newBlock: Block = {
                  id: 'blk_' + Date.now() + '_' + Math.random().toString(36).slice(2),
                  type: blockType, content, order: 0,
                };
                if (afterId) {
                  const idx = list.findIndex(b => b.id === afterId);
                  if (idx !== -1) {
                    const next2 = [...list];
                    next2.splice(idx + 1, 0, newBlock);
                    return next2.map((b, i) => ({ ...b, order: i }));
                  }
                }
                return [...list, newBlock].map((b, i) => ({ ...b, order: i }));
              });
              this.onFieldChange();
            }
          }

          const allSettled = this.uploadFiles().every(f => f.status === 'done' || f.status === 'error');
          if (allSettled) setTimeout(() => this.closeModal(), 600);
        } else {
          this._patchFile(fileId, { status: 'error', error: response.error?.details || 'Upload failed' });
          const allSettled = this.uploadFiles().every(f => f.status === 'done' || f.status === 'error');
          if (allSettled) setTimeout(() => this.closeModal(), 600);
        }
      },
      error: (err) => {
        this._patchFile(fileId, { status: 'error', error: err.message || 'Upload failed' });
        const allSettled = this.uploadFiles().every(f => f.status === 'done' || f.status === 'error');
        if (allSettled) setTimeout(() => this.closeModal(), 600);
      }
    });
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
    this.uploadTarget.set(null);
    this.cellPickerBlockId.set(null);
  }

  dismissInsertPicker(): void {
    this.insertTargetId.set(null);
    this.styleEditorBlockId.set(null);
  }
}
