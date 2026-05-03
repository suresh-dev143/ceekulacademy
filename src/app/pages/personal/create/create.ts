import { Component, signal, computed, inject, OnInit, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreatorService, ContentType, ContentState, CreatorBlock, ContentDoc, DraftPayload } from '../../../services/creator.service';
import { ClaudeService, ContentEvaluation } from '../../../services/claude.service';
import {
  TransformService, TransformTargetType, TransformResult,
  TransformedWorkshop, TransformedCourse, TransformedResearch, TransformedAdvertisement,
} from '../../../services/transform.service';
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

export interface WorkshopSession {
  id: string;
  title: string;
  description: string;
}

export interface CourseLecture {
  id: string;
  title: string;
  objectives: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  due: string;
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
  imports: [CommonModule, CeekulRendererPipe],
  templateUrl: './create.html',
  styleUrl: './create.scss',
})
export class Create implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly claudeService = inject(ClaudeService);
  private readonly transformService = inject(TransformService);
  private readonly destroy$ = new Subject<void>();
  private readonly autosave$ = new Subject<void>();
  private _isExistingDraft = false;
  private _loadedIdentity = { title: '', category: '' };

  // ── Evaluation ─────────────────────────────────────────────────────────────
  readonly evalResult = signal<ContentEvaluation | null>(null);
  readonly pendingAction = signal<'share' | 'send' | null>(null);
  private readonly evalCache = new Map<string, ContentEvaluation>();

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
  readonly category = signal<string>('');
  readonly blocks = signal<Block[]>([]);
  readonly contentState = signal<ContentState>('draft');

  // ── Evolution ──────────────────────────────────────────────────────────────
  readonly userUpdates = signal<UpdateEntry[]>([]);
  readonly aiUpdates = signal<UpdateEntry[]>([]);
  readonly personalContext = signal<PersonalizationContext>({ age: 28, health: 'optimal', cognition: 'standard' });
  readonly isAdapted = signal(false);

  // ── Ideas & Updates ────────────────────────────────────────────────────────
  readonly ideasText = signal('');
  readonly ideasLoading = signal(false);
  readonly updateTab = signal<'creator' | 'ai'>('creator');
  readonly updateSegmentId = signal('');
  readonly updateContent = signal('');
  readonly aiUpdateLoading = signal(false);
  readonly aiUpdateResult = signal('');

  // ── Collaboration ──────────────────────────────────────────────────────────
  readonly collaboratorInput = signal('');
  readonly collaboratorIds = signal<string[]>([]);

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

  readonly DOMAINS = [
    { id: 'education',  label: 'Education'  },
    { id: 'technology', label: 'Technology' },
    { id: 'science',    label: 'Science'    },
    { id: 'business',   label: 'Business'   },
    { id: 'arts',       label: 'Arts'       },
    { id: 'health',     label: 'Health'     },
    { id: 'other',      label: 'Other'      },
  ];

  readonly CONTENT_CATEGORIES: { id: string; label: string; icon: string }[] = [
    { id: 'course',        label: 'Course',        icon: '📚' },
    { id: 'research',      label: 'Research',      icon: '🔬' },
    { id: 'project',       label: 'Project',       icon: '🏗️' },
    { id: 'webinar',       label: 'Webinar',       icon: '🎙️' },
    { id: 'workshop',      label: 'Workshop',      icon: '🛠️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
    { id: 'other',         label: 'Other',         icon: '📢' },
  ];

  readonly CATEGORY_META: Record<string, { color: string; template: BlockType[] }> = {
    course:        { color: '#6366f1', template: ['text', 'code']            },
    research:      { color: '#10b981', template: ['text', 'text']            },
    project:       { color: '#f59e0b', template: ['text', 'code', 'image']  },
    webinar:       { color: '#3b82f6', template: ['text', 'video']          },
    workshop:      { color: '#8b5cf6', template: ['text', 'code', 'columns'] },
    entertainment: { color: '#ec4899', template: ['text', 'image']          },
    other:         { color: '#6366f1', template: ['text']                    },
  };

  readonly BLOCK_TYPES: { type: BlockType; label: string; icon: string; desc: string }[] = [
    { type: 'text',    label: 'Text',    icon: '✍',  desc: 'Atomic text segment'  },
    { type: 'code',    label: 'Code',    icon: '⌨',  desc: 'Code architecture'    },
    { type: 'image',   label: 'Image',   icon: '📸', desc: 'Visual media'         },
    { type: 'video',   label: 'Video',   icon: '🎬', desc: 'Motion content'       },
    { type: 'audio',   label: 'Audio',   icon: '🎵', desc: 'Sonic data'           },
    { type: 'divider', label: 'Divider', icon: '―',  desc: 'Logical break'        },
    { type: 'columns', label: 'Columns', icon: '▤',  desc: 'Multi-column layout'  },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────

  readonly categoryAccentColor = computed(() => {
    const cat = this.category().toLowerCase().trim();
    const match = this.CONTENT_CATEGORIES.find(c => c.label.toLowerCase() === cat);
    return match ? (this.CATEGORY_META[match.id]?.color ?? '#6366f1') : '#6366f1';
  });

  readonly categoryId = computed(() => {
    const cat = this.category().toLowerCase().trim();
    return this.CONTENT_CATEGORIES.find(c => c.label.toLowerCase() === cat)?.id ?? 'other';
  });

  // ── Workshop Structure ────────────────────────────────────────────────────
  readonly workshopSessions = signal<WorkshopSession[]>([
    { id: 'ws1', title: '', description: '' },
    { id: 'ws2', title: '', description: '' },
    { id: 'ws3', title: '', description: '' },
  ]);

  // ── Course Structure ──────────────────────────────────────────────────────
  readonly courseLectures = signal<CourseLecture[]>([]);

  // ── Research Structure ────────────────────────────────────────────────────
  readonly researchIdea        = signal('');
  readonly researchBackground  = signal('');
  readonly researchMethodology = signal('');
  readonly researchOutcome     = signal('');
  readonly researchCollabs     = signal<string[]>([]);
  readonly researchCollabDraft = signal('');

  // ── Project Structure ─────────────────────────────────────────────────────
  readonly projectObjective  = signal('');
  readonly projectMilestones = signal<ProjectMilestone[]>([]);
  readonly projectResources  = signal<string[]>([]);
  readonly milestoneDraft    = signal({ title: '', due: '' });
  readonly resourceDraft     = signal('');

  // ── Webinar Structure ─────────────────────────────────────────────────────
  readonly webinarDateTime = signal('');
  readonly webinarSpeakers = signal<string[]>([]);
  readonly webinarTopics   = signal<string[]>([]);
  readonly webinarRegUrl   = signal('');
  readonly speakerDraft    = signal('');
  readonly topicDraft      = signal('');

  // ── Advertisement Structure ───────────────────────────────────────────────
  readonly adAudience    = signal('');
  readonly adTags        = signal<string[]>([]);
  readonly adMediaUrl    = signal('');
  readonly adRedirectUrl = signal('');
  readonly adBudget      = signal('');
  readonly adDuration    = signal('');
  readonly adTagDraft    = signal('');

  // ── Use As / Transform ───────────────────────────────────────────────────
  readonly transformSaving  = signal(false);
  readonly transformLoading = signal(false);
  readonly transformResult  = signal<TransformResult | null>(null);
  readonly transformError   = signal<string | null>(null);

  goToLibrary(): void {
    this.router.navigate(['/personal/library']);
  }
  constructor() {
    // this.autosave$.pipe(
    //   debounceTime(1500),
    //   takeUntil(this.destroy$)
    // ).subscribe(() => this.performAutosave());
  }

  ngOnInit(): void {
    const paramId = this.route.snapshot.paramMap.get('baseId');
    const useAs   = this.route.snapshot.queryParamMap.get('useAs') as TransformTargetType | null;
    if (paramId) {
      this.baseId.set(paramId);
      this._loadFromServer(paramId, useAs ?? undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  save(): void { this.performAutosave(); 
    console.log('Manual save triggered'); }

  update(segmentId: string, content: string): void {
    this.userUpdates.update(u => [...u, { segmentId, content, type: 'user', timestamp: new Date() }]);
    this.onFieldChange();
  }

  share(): void { this.triggerEvaluation('share'); }

  send(): void { this.triggerEvaluation('send'); }

  private triggerEvaluation(action: 'share' | 'send'): void {
    const hash = this.contentHash();
    const cached = this.evalCache.get(hash);
    if (cached) { this.applyEvalResult(cached, action); return; }

    this.pendingAction.set(action);
    this.activeModal.set('eval-loading');

    this.claudeService.evaluateContent({
      title: this.title(),
      subtitle: this.subtitle(),
      snippet: this.getSnippet(),
    }).subscribe({
      next: ({ data }) => {
        this.evalCache.set(hash, data);
        this.applyEvalResult(data, action);
      },
      error: () => {
        const fallback: ContentEvaluation = {
          status:         action === 'share' ? 'allow' : 'restrict',
          classification: 'safe',
          relevance:      1,
          category:       'Course',
          issues:         action === 'send' ? ['AI evaluation unavailable — Send blocked as a precaution.'] : [],
          routing:        { allowed: action === 'share', reason: 'AI fallback mode' },
        };
        this.evalCache.set(hash, fallback);
        this.applyEvalResult(fallback, action);
      },
    });
  }

  private applyEvalResult(result: ContentEvaluation, action: 'share' | 'send'): void {
    this.evalResult.set(result);
    // Auto-apply AI-suggested category when none selected
    if (!this.category() && result.category) {
      this.category.set(result.category);
    }
    if (result.status === 'allow') {
      this.activeModal.set(action);
      this.pendingAction.set(null);
    } else {
      this.pendingAction.set(action);
      this.activeModal.set('eval-result');
    }
  }

  proceedAfterWarning(): void {
    const action = this.pendingAction();
    if (action) {
      this.pendingAction.set(null);
      this.activeModal.set(action);
    }
  }

  private contentHash(): string {
    const str = `${this.title()}|${this.subtitle()}|${this.getSnippet()}`;
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(16);
  }

  private getSnippet(): string {
    return this.blocks()
      .filter(b => b.type === 'text')
      .map(b => (b.content['html'] as string) || '')
      .join(' ')
      .slice(0, 300);
  }

  toggleAdaptation(): void { this.isAdapted.update(v => !v); }

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
      userMessage: `For the topic "${this.title()}" (category: ${this.category() || 'general'}), share 5 recent research insights that would enrich this content. Numbered list, one concise paragraph each.`,
      contentContext: { title: this.title(), category: this.category() },
    }).subscribe({
      next: ({ data }) => { this.ideasText.set(data.reply); this.ideasLoading.set(false); },
      error: () => { this.ideasText.set('Unable to load ideas right now.'); this.ideasLoading.set(false); },
    });
  }

  applyCreatorUpdate(): void {
    const segId   = this.updateSegmentId().trim();
    const content = this.updateContent().trim();
    if (!segId || !content) return;
    this.userUpdates.update(u => [...u, { segmentId: segId, content, type: 'user', timestamp: new Date() }]);
    this.isAdapted.set(true);
    this.updateSegmentId.set('');
    this.updateContent.set('');
    this.onFieldChange();
  }

  fetchAiUpdate(): void {
    if (!this.title()) return;
    this.aiUpdateLoading.set(true);
    this.aiUpdateResult.set('');
    this.claudeService.askCoTeacher({
      userMessage: `For content titled "${this.title()}" — context: "${this.getSnippet()}" — provide 3 research-backed updates. Each on one line: TARGET: [exact phrase to enhance] | UPDATE: [enriched replacement]`,
      contentContext: { title: this.title(), category: this.category() },
    }).subscribe({
      next: ({ data }) => {
        this.aiUpdateResult.set(data.reply);
        const parsed: UpdateEntry[] = data.reply
          .split('\n')
          .filter((l: string) => l.includes('TARGET:') && l.includes('UPDATE:'))
          .map((line: string) => ({
            segmentId: (line.match(/TARGET:\s*([^|]+)/)?.[1] ?? '').trim(),
            content:   (line.match(/UPDATE:\s*(.+)/)?.[1] ?? '').trim(),
            type:      'ai' as const,
            timestamp: new Date(),
          }))
          .filter((u: UpdateEntry) => u.segmentId && u.content);
        if (parsed.length > 0) {
          this.aiUpdates.update(e => [...e, ...parsed]);
          this.isAdapted.set(true);
          this.onFieldChange();
        }
        this.aiUpdateLoading.set(false);
      },
      error: () => { this.aiUpdateLoading.set(false); },
    });
  }

  // ── Structure Methods ────────────────────────────────────────────────────

  patchSession(id: string, field: 'title' | 'description', value: string): void {
    this.workshopSessions.update(ss => ss.map(s => s.id === id ? { ...s, [field]: value } : s));
    this.onFieldChange();
  }

  addLecture(): void {
    this.courseLectures.update(ls => [...ls, { id: 'lec_' + Date.now(), title: '', objectives: '' }]);
    this.onFieldChange();
  }

  removeLecture(id: string): void {
    this.courseLectures.update(ls => ls.filter(l => l.id !== id));
    this.onFieldChange();
  }

  patchLecture(id: string, field: 'title' | 'objectives', value: string): void {
    this.courseLectures.update(ls => ls.map(l => l.id === id ? { ...l, [field]: value } : l));
    this.onFieldChange();
  }

  addResearchCollab(): void {
    const d = this.researchCollabDraft().trim();
    if (!d) return;
    this.researchCollabs.update(c => [...c, d]);
    this.researchCollabDraft.set('');
    this.onFieldChange();
  }

  removeResearchCollab(c: string): void {
    this.researchCollabs.update(cs => cs.filter(x => x !== c));
    this.onFieldChange();
  }

  addMilestone(): void {
    const d = this.milestoneDraft();
    if (!d.title) return;
    this.projectMilestones.update(ms => [...ms, { id: 'ms_' + Date.now(), title: d.title, due: d.due }]);
    this.milestoneDraft.set({ title: '', due: '' });
    this.onFieldChange();
  }

  removeMilestone(id: string): void {
    this.projectMilestones.update(ms => ms.filter(m => m.id !== id));
    this.onFieldChange();
  }

  addResource(): void {
    const d = this.resourceDraft().trim();
    if (!d) return;
    this.projectResources.update(rs => [...rs, d]);
    this.resourceDraft.set('');
    this.onFieldChange();
  }

  removeResource(r: string): void {
    this.projectResources.update(rs => rs.filter(x => x !== r));
    this.onFieldChange();
  }

  addSpeaker(): void {
    const d = this.speakerDraft().trim();
    if (!d) return;
    this.webinarSpeakers.update(ss => [...ss, d]);
    this.speakerDraft.set('');
    this.onFieldChange();
  }

  removeSpeaker(s: string): void {
    this.webinarSpeakers.update(ss => ss.filter(x => x !== s));
    this.onFieldChange();
  }

  addTopic(): void {
    const d = this.topicDraft().trim();
    if (!d) return;
    this.webinarTopics.update(ts => [...ts, d]);
    this.topicDraft.set('');
    this.onFieldChange();
  }

  removeTopic(t: string): void {
    this.webinarTopics.update(ts => ts.filter(x => x !== t));
    this.onFieldChange();
  }

  addAdTag(): void {
    const d = this.adTagDraft().trim();
    if (!d) return;
    this.adTags.update(ts => [...ts, d]);
    this.adTagDraft.set('');
    this.onFieldChange();
  }

  removeAdTag(t: string): void {
    this.adTags.update(ts => ts.filter(x => x !== t));
    this.onFieldChange();
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
    this.category.set('');
    this.domain.set('education');
    this.contentType.set('L');
    this.contentState.set('draft');
    this.collaboratorIds.set([]);
    this.userUpdates.set([]);
    this.aiUpdates.set([]);
    this.syncStatus.set('synced');
    this._resetStructures();
  }

  private _serializeStructure(): Record<string, unknown> {
    const id = this.categoryId();
    switch (id) {
      case 'workshop':
        return { type: 'workshop', sessions: this.workshopSessions() };
      case 'course':
        return { type: 'course', lectures: this.courseLectures() };
      case 'research':
        return {
          type: 'research',
          idea: this.researchIdea(), background: this.researchBackground(),
          methodology: this.researchMethodology(), outcome: this.researchOutcome(),
          collaborators: this.researchCollabs(),
        };
      case 'project':
        return {
          type: 'project',
          objective: this.projectObjective(),
          milestones: this.projectMilestones(),
          resources: this.projectResources(),
        };
      case 'webinar':
        return {
          type: 'webinar',
          dateTime: this.webinarDateTime(), speakers: this.webinarSpeakers(),
          topics: this.webinarTopics(), registrationUrl: this.webinarRegUrl(),
        };
      case 'entertainment':
        return {
          type: 'entertainment',
          audience: this.adAudience(), tags: this.adTags(),
          mediaUrl: this.adMediaUrl(), redirectUrl: this.adRedirectUrl(),
          budget: this.adBudget(), duration: this.adDuration(),
        };
      default:
        return { type: 'other' };
    }
  }

  private _resetStructures(): void {
    this.workshopSessions.set([
      { id: 'ws1', title: '', description: '' },
      { id: 'ws2', title: '', description: '' },
      { id: 'ws3', title: '', description: '' },
    ]);
    this.courseLectures.set([]);
    this.researchIdea.set('');
    this.researchBackground.set('');
    this.researchMethodology.set('');
    this.researchOutcome.set('');
    this.researchCollabs.set([]);
    this.projectObjective.set('');
    this.projectMilestones.set([]);
    this.projectResources.set([]);
    this.webinarDateTime.set('');
    this.webinarSpeakers.set([]);
    this.webinarTopics.set([]);
    this.webinarRegUrl.set('');
    this.adAudience.set('');
    this.adTags.set([]);
    this.adMediaUrl.set('');
    this.adRedirectUrl.set('');
    this.adBudget.set('');
    this.adDuration.set('');
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private performAutosave(): void {
     console.log('Performing autosave... 1');
    if (!this.title()) return;
    this.syncStatus.set('saving');
   console.log('Performing autosave... 2');
    const apiBlocks: CreatorBlock[] = this.blocks().map(b => ({
      blockId: b.id,
      type: b.type as CreatorBlock['type'],
      content: b.content,
      order: b.order,
    }));

    const payload: DraftPayload = {
      title: this.title(),
      contentType: this.contentType(),
      domain: this.domain(),
      category: this.category(),
      blocks: apiBlocks,
    };
    console.log('Performing payloadn 3', payload);
        if (this.baseId()) {
      this.creatorService.updateDraft(this.baseId(), payload).subscribe({
        next: ({ data }) => {
          this.hybridId.set(data.hybridId);
          this.syncStatus.set('synced');
        },
        error: () => this.syncStatus.set('error'),
      });
    } else {
     console.log('Performing payload else  4', payload);
      this.creatorService.createDraft(payload).subscribe({
        next: ({ data }) => {
          this.baseId.set(data.baseId);
          this.hybridId.set(data.hybridId);
          this.syncStatus.set('synced');
          this.router.navigate(['/personal/create', data.baseId], { replaceUrl: true });
        },
        error: () => this.syncStatus.set('error'),
      });
    }
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
      case 'text':    return { html: '' };
      case 'code':    return { code: '', language: 'javascript' };
      case 'image':   return { src: '', alt: '', caption: '' };
      case 'video':   return { src: '', caption: '' };
      case 'audio':   return { src: '', title: '' };
      case 'divider': return { style: 'line' };
      case 'columns': return { left: '', right: '' };
    }
  }

  onIdentityChange(): void {
    this.onFieldChange();
    if (!this._isExistingDraft) return;

    const changed =
      this.title()    !== this._loadedIdentity.title ||
      this.category() !== this._loadedIdentity.category;

    if (changed) {
      this._isExistingDraft = false;
      this._loadedIdentity  = { title: '', category: '' };
      this.baseId.set('');
      this.hybridId.set('');
      this.blocks.set([]);
      this.contentState.set('draft');
      this._resetStructures();
      this.router.navigate(['/personal/create'], { replaceUrl: true });
    }
  }

  private _loadFromServer(baseId: string, autoTransform?: TransformTargetType): void {
    this.syncStatus.set('saving');
    this.creatorService.getDraft(baseId).subscribe({
      next: ({ data }) => {
        this.title.set(data.title);
        this.hybridId.set(data.hybridId);
        this.contentType.set(data.contentType);
        this.domain.set(data.domain);
        this.category.set(data.category ?? '');
        this.contentState.set(data.state);
        this._isExistingDraft = true;
        this._loadedIdentity  = { title: data.title, category: data.category ?? '' };
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

        if (autoTransform) {
          // Remove the query param from the URL without reloading
          this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
          this.activeModal.set('use-as');
          this.runTransform(autoTransform);
        }
      },
      error: () => this.syncStatus.set('error'),
    });
  }

  // ── Placement ──────────────────────────────────────────────────────────────

  addCollaborator(): void {
    const id = this.collaboratorInput().trim();
    if (id && !this.collaboratorIds().includes(id)) {
      this.collaboratorIds.update(ids => [...ids, id]);
    }
    this.collaboratorInput.set('');
  }

  removeCollaborator(id: string): void {
    this.collaboratorIds.update(ids => ids.filter(c => c !== id));
  }

  shareContent(): void {
    if (!this.baseId()) return;
    this.creatorService.share(this.baseId(), this.collaboratorIds()).subscribe({
      next: ({ data }) => {
        this.contentState.set(data.content.state);
        this.collaboratorIds.set([]);
        this.closeModal();
      },
      error: () => this.closeModal(),
    });
  }

  publishContent(): void {
    if (!this.baseId()) return;
    this.creatorService.publish(this.baseId()).subscribe({
      next: ({ data }) => {
        this.contentState.set(data.state);
        this.closeModal();
      },
      error: () => this.closeModal(),
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

  // ── Use As / Transform ───────────────────────────────────────────────────

  openUseAs(): void {
    this.transformResult.set(null);
    this.transformError.set(null);
    this.activeModal.set('use-as');

    if (this.baseId()) return; // already saved — show picker immediately

    if (!this.title() || this.blocks().length === 0) {
      this.transformError.set('Add a title and at least one content block first.');
      return;
    }

    // No CID yet — save now and unblock the picker when done
    this.transformSaving.set(true);
    const apiBlocks: CreatorBlock[] = this.blocks().map(b => ({
      blockId: b.id,
      type: b.type as CreatorBlock['type'],
      content: b.content,
      order: b.order,
    }));

    this.creatorService.createDraft({
      title: this.title(),
      contentType: this.contentType(),
      domain: this.domain(),
      category: this.category(),
      blocks: apiBlocks,
    }).subscribe({
      next: ({ data }) => {
        this.baseId.set(data.baseId);
        this.hybridId.set(data.hybridId);
        this.syncStatus.set('synced');
        this.router.navigate(['/personal/create', data.baseId], { replaceUrl: true });
        this.transformSaving.set(false);
      },
      error: () => {
        this.transformSaving.set(false);
        this.transformError.set('Failed to save content. Please try again.');
      },
    });
  }

  runTransform(type: TransformTargetType): void {
    const cid = this.baseId();
    if (!cid) { this.transformError.set('Save your content first before transforming.'); return; }

    this.transformLoading.set(true);
    this.transformError.set(null);
    this.transformResult.set(null);

    this.transformService.transform(cid, type).subscribe({
      next: ({ data }) => {
        this.transformResult.set(data);
        this.transformLoading.set(false);
        if (data.status === 'ok') this._applyTransform(data);
      },
      error: () => {
        this.transformError.set('Transformation failed. Please try again.');
        this.transformLoading.set(false);
      },
    });
  }

  private _applyTransform(result: TransformResult): void {
    if (this.transformService.isWorkshop(result.data)) {
      const d = result.data as TransformedWorkshop;
      this.workshopSessions.set(
        d.sessions.map((s, i) => ({ id: `ws${i + 1}`, title: s.title, description: s.description }))
      );
      this.category.set('Workshop');
    } else if (this.transformService.isCourse(result.data)) {
      const d = result.data as TransformedCourse;
      this.courseLectures.set(
        d.lectures.map((l, i) => ({ id: `lec_${i}`, title: l.title, objectives: l.description }))
      );
      this.category.set('Course');
    } else if (this.transformService.isResearch(result.data)) {
      const d = result.data as TransformedResearch;
      this.researchIdea.set(d.problem);
      this.researchBackground.set(d.hypothesis);
      this.category.set('Research');
    } else if (this.transformService.isAdvertisement(result.data)) {
      const d = result.data as TransformedAdvertisement;
      this.adMediaUrl.set(d.mediaUrl);
      this.category.set('Entertainment');
    }
    this.onFieldChange();
  }

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
    this.transformResult.set(null);
    this.transformError.set(null);
    this.transformSaving.set(false);
  }
}
