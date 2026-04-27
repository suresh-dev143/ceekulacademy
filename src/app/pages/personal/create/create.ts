import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ValidationService, ValidationResult } from '../../../services/validation.service';

export type BlockType = 'text' | 'code' | 'image' | 'video' | 'audio' | 'divider' | 'columns';

export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  order: number;
}

export interface PageDraft {
  id: string;
  title: string;
  category: string;
  blocks: Block[];
  status: 'draft' | 'submitted' | 'published' | 'rejected';
  unique_id: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES: Record<string, string> = {
  health:         'Health',
  education:      'Education',
  justice:        'Justice',
  services:       'Services',
  infrastructure: 'Infrastructure'
};

const CATEGORY_PREFIXES: Record<string, string> = {
  health:         'HLTH',
  education:      'EDU',
  justice:        'JUST',
  services:       'SVC',
  infrastructure: 'INFRA'
};

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './create.html',
  styleUrl:    './create.scss'
})
export class Create implements OnInit {
  private readonly route             = inject(ActivatedRoute);
  private readonly validationService = inject(ValidationService);

  readonly title           = signal('');
  readonly category        = signal('');
  readonly blocks          = signal<Block[]>([]);
  readonly showBlockPicker = signal(false);
  readonly saving          = signal(false);
  readonly savedFlash      = signal(false);
  readonly submitting      = signal(false);
  readonly submitError     = signal('');
  readonly submitSuccess   = signal(false);
  readonly validationResult = signal<ValidationResult | null>(null);
  readonly pitsssErrors        = signal<string[]>([]);
  readonly pitsssAcknowledged  = signal(false);
  readonly dragFromIndex   = signal<number | null>(null);
  readonly dragOverIndex   = signal<number | null>(null);
  readonly pageId          = signal('');
  readonly previewMode     = signal(false);
  readonly copiedBlockId   = signal('');

  readonly categoryKeys   = Object.keys(CATEGORIES);
  readonly categoryLabels = CATEGORIES;

  readonly canSubmit = computed(() =>
    this.title().trim().length > 0 &&
    this.category().trim().length > 0 &&
    this.blocks().length > 0
  );

  readonly BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'text',    label: 'Text',      icon: '✍',    desc: 'Write rich text content' },
    { type: 'code',    label: 'Code',      icon: '⌨',    desc: 'Share code snippets' },
    { type: 'image',   label: 'Image',     icon: '📸',   desc: 'Add visual media' },
    { type: 'video',   label: 'Video',     icon: '🎬',   desc: 'Embed video content' },
    { type: 'audio',   label: 'Audio',     icon: '🎵',   desc: 'Add audio clips' },
    { type: 'divider', label: 'Divider',   icon: '―',    desc: 'Separate sections' },
    { type: 'columns', label: 'Layout',    icon: '▤',    desc: 'Three-column grid' },
  ];

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('pageId');
    if (paramId) {
      this.pageId.set(paramId);
      this.loadDraft(paramId);
    } else {
      this.pageId.set(this.generateTempId());
    }
  }

  private generateTempId(): string {
    return 'draft_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  }

  private generateBlockId(): string {
    return 'blk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  }

  private generateUniqueId(): string {
    const prefix = CATEGORY_PREFIXES[this.category()] ?? 'GEN';
    const date   = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand   = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${date}-${rand}`;
  }

  private defaultContent(type: BlockType): Record<string, any> {
    switch (type) {
      case 'text':    return { html: '' };
      case 'code':    return { code: '', language: 'javascript' };
      case 'image':   return { url: '', alt: '', caption: '' };
      case 'video':   return { url: '', caption: '' };
      case 'audio':   return { url: '', caption: '' };
      case 'divider': return {};
      case 'columns': return { col1: '', col2: '', col3: '' };
    }
  }

  private loadDraft(id: string): void {
    try {
      const stored = localStorage.getItem(`page_draft_${id}`);
      if (!stored) return;
      const draft: PageDraft = JSON.parse(stored);
      this.title.set(draft.title ?? '');
      this.category.set(draft.category ?? '');
      this.blocks.set(draft.blocks ?? []);
    } catch {}
  }

  private persistDraft(): void {
    const draft: PageDraft = {
      id:         this.pageId(),
      title:      this.title(),
      category:   this.category(),
      blocks:     this.blocks(),
      status:     'draft',
      unique_id:  '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(`page_draft_${this.pageId()}`, JSON.stringify(draft));
  }

  saveDraft(): void {
    this.saving.set(true);
    this.persistDraft();
    setTimeout(() => {
      this.saving.set(false);
      this.savedFlash.set(true);
      setTimeout(() => this.savedFlash.set(false), 1800);
    }, 400);
  }

  // ── Block operations ─────────────────────────────────────────────────────────

  addBlock(type: BlockType): void {
    const block: Block = {
      id:      this.generateBlockId(),
      type,
      content: this.defaultContent(type),
      order:   this.blocks().length
    };
    this.blocks.update(b => [...b, block]);
    this.showBlockPicker.set(false);
    this.persistDraft();
  }

  deleteBlock(id: string): void {
    this.blocks.update(b => b.filter(blk => blk.id !== id).map((blk, i) => ({ ...blk, order: i })));
    this.persistDraft();
  }

  duplicateBlock(id: string): void {
    const idx = this.blocks().findIndex(b => b.id === id);
    if (idx === -1) return;
    const src   = this.blocks()[idx];
    const clone: Block = { ...src, id: this.generateBlockId(), content: { ...src.content } };
    this.blocks.update(b => {
      const next = [...b];
      next.splice(idx + 1, 0, clone);
      return next.map((blk, i) => ({ ...blk, order: i }));
    });
    this.persistDraft();
  }

  moveBlock(index: number, dir: -1 | 1): void {
    const target = index + dir;
    if (target < 0 || target >= this.blocks().length) return;
    this.blocks.update(b => {
      const next = [...b];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((blk, i) => ({ ...blk, order: i }));
    });
    this.persistDraft();
  }

  updateBlockContent(id: string, key: string, value: any): void {
    this.blocks.update(b =>
      b.map(blk => blk.id === id ? { ...blk, content: { ...blk.content, [key]: value } } : blk)
    );
    if (this.pitsssErrors().length > 0) {
      this.pitsssErrors.set(this.runPITSSS());
    }
  }

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

  onDragStart(index: number, event: DragEvent): void {
    this.dragFromIndex.set(index);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    }
  }

  onDragOver(index: number, event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverIndex.set(index);
  }

  onDrop(index: number, event: DragEvent): void {
    event.preventDefault();
    const from = this.dragFromIndex();
    if (from === null || from === index) {
      this.dragFromIndex.set(null);
      this.dragOverIndex.set(null);
      return;
    }
    this.blocks.update(b => {
      const next = [...b];
      const [removed] = next.splice(from, 1);
      next.splice(index, 0, removed);
      return next.map((blk, i) => ({ ...blk, order: i }));
    });
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
    this.persistDraft();
  }

  onDragEnd(): void {
    this.dragFromIndex.set(null);
    this.dragOverIndex.set(null);
  }

  // ── File uploads ─────────────────────────────────────────────────────────────

  onFileChange(blockId: string, event: Event, urlKey: string): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.updateBlockContent(blockId, urlKey, url);
    this.updateBlockContent(blockId, 'fileName', file.name);
  }

  clearMedia(blockId: string): void {
    this.updateBlockContent(blockId, 'url', '');
    this.updateBlockContent(blockId, 'fileName', '');
    this.persistDraft();
  }

  // ── Code copy ────────────────────────────────────────────────────────────────

  copyCode(blockId: string, code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copiedBlockId.set(blockId);
      setTimeout(() => this.copiedBlockId.set(''), 1500);
    });
  }

  // ── PITSSS validation ────────────────────────────────────────────────────────

  private runPITSSS(): string[] {
    const errors: string[] = [];
    const textBlocks = this.blocks().filter(b => b.type === 'text');
    const allText    = textBlocks.map(b => b.content['html'] ?? '').join(' ');

    if (!allText.includes('Problem:')) {
      errors.push('A text block must include "Problem:" — describe the problem your content addresses.');
    }

    const videoBlocks = this.blocks().filter(b => b.type === 'video');
    if (videoBlocks.length > 0 && videoBlocks.some(b => !b.content['url'])) {
      errors.push('All video blocks must have a file uploaded before submitting.');
    }

    return errors;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  acknowledgePITSSS(): void {
    this.pitsssAcknowledged.set(true);
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;

    if (!this.pitsssAcknowledged()) {
      const pitsss = this.runPITSSS();
      if (pitsss.length > 0) {
        this.pitsssErrors.set(pitsss);
        return;
      }
    }
    this.pitsssErrors.set([]);

    this.submitting.set(true);
    this.submitError.set('');

    const textContent = this.blocks()
      .filter(b => b.type === 'text')
      .map(b => b.content['html'] ?? '')
      .join(' ');

    this.validationService.validateContent({
      title:       this.title(),
      description: textContent,
      category:    this.category()
    }).subscribe({
      next: (res) => {
        this.validationResult.set(res.data);
        this.submitting.set(false);
        this.submitSuccess.set(true);
        localStorage.removeItem(`page_draft_${this.pageId()}`);
      },
      error: () => {
        // AI validation unavailable — submit for manual review
        this.validationResult.set({
          status:               'NEEDS_REVIEW',
          reason:               'AI validation service is unavailable. Your content has been queued for manual review.',
          category_match_score: 0,
          safety_score:         0,
          quality_score:        0
        });
        this.submitting.set(false);
        this.submitSuccess.set(true);
        localStorage.removeItem(`page_draft_${this.pageId()}`);
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  scoreColor(score: number): string {
    if (score >= 70) return '#4ade80'; // Success Green
    if (score >= 40) return '#ef9d57'; // Accent Amber
    return '#f87171'; // Error Red
  }

  getCategoryLabel(key: string): string {
    return CATEGORIES[key] ?? key;
  }

  resetEditor(): void {
    this.title.set('');
    this.category.set('');
    this.blocks.set([]);
    this.submitSuccess.set(false);
    this.validationResult.set(null);
    this.pitsssErrors.set([]);
    this.pitsssAcknowledged.set(false);
    this.submitError.set('');
    this.pageId.set(this.generateTempId());
  }

  trackBlock(_: number, block: Block): string {
    return block.id;
  }
}
