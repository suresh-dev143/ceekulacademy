import {
  Component, OnInit, OnDestroy, inject, signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval } from 'rxjs';
import { switchMap, catchError, of, map, takeUntil } from 'rxjs';
import { AnnotationService, Annotation, ThreadMessage } from '../../../services/annotation.service';
import { ContentFocusService } from '../../../services/content-focus.service';
import { AuthService } from '../../../services/auth.service';

interface RangeSummary { icon: string; label: string; }

function describeRange(ann: Annotation): RangeSummary {
  const r = ann.range;
  if (!r) return { icon: '📄', label: 'Full block' };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  switch (r.kind) {
    case 'text':
      return {
        icon: '✏️',
        label: r.selectedText
          ? `"${r.selectedText.slice(0, 80)}${r.selectedText.length > 80 ? '…' : ''}"`
          : 'Text selection',
      };
    case 'video':
      return { icon: '🎥', label: `Video ${fmt(r.fromSeconds ?? 0)}–${fmt(r.toSeconds ?? 0)}` };
    case 'image':
      return { icon: '🖼️', label: 'Image region' };
    case 'cell':
      return { icon: '⊞', label: 'Canvas cell' };
    default:
      return { icon: '📄', label: 'Full block' };
  }
}

@Component({
  selector: 'app-shared-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './shared-thread.html',
  styleUrl: './shared-thread.scss',
})
export class SharedThreadComponent implements OnInit, OnDestroy {

  private readonly route         = inject(ActivatedRoute);
  private readonly annotationSvc = inject(AnnotationService);
  private readonly authSvc       = inject(AuthService);
  readonly         toolMeta      = inject(ContentFocusService).TOOL_META;

  // ── Auth ──────────────────────────────────────────────────────────────────────
  readonly isLoggedIn = this.authSvc.isLoggedIn;

  // ── Thread state ─────────────────────────────────────────────────────────────
  readonly loading      = signal(true);
  readonly loadError    = signal<string | null>(null);
  readonly annotation   = signal<Annotation | null>(null);
  readonly rangeSummary = signal<RangeSummary>({ icon: '📄', label: '' });
  readonly newMessages  = signal(0);

  // ── Reply state ───────────────────────────────────────────────────────────────
  readonly replyLoading = signal(false);
  readonly replyError   = signal<string | null>(null);
  replyInput = '';
  askAiToo   = false;

  private _token  = '';
  private _lastCount = 0;
  private readonly _destroy$ = new Subject<void>();

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Initial load
    this.route.paramMap.pipe(
      switchMap(p => {
        this._token = p.get('token') ?? '';
        this.loading.set(true);
        return this._fetch();
      }),
      takeUntil(this._destroy$),
    ).subscribe(ann => this._apply(ann));

    // Live poll every 15 s
    interval(15_000).pipe(
      switchMap(() => this._fetch()),
      takeUntil(this._destroy$),
    ).subscribe(ann => {
      if (!ann || this.replyLoading()) return;
      const prev = this.annotation();
      if (prev && ann.thread.length > prev.thread.length) {
        this.newMessages.update(n => n + (ann.thread.length - prev.thread.length));
      }
      this.annotation.set(ann);
    });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private _fetch() {
    return this.annotationSvc.getByShareToken(this._token).pipe(catchError(() => of(null)));
  }

  private _apply(ann: Annotation | null): void {
    this.loading.set(false);
    if (!ann) {
      this.loadError.set('This link is invalid or the thread is no longer public.');
      return;
    }
    this.annotation.set(ann);
    this.rangeSummary.set(describeRange(ann));
    this._lastCount = ann.thread.length;
  }

  // ── Reply ─────────────────────────────────────────────────────────────────────

  get contentContext(): string {
    const ann = this.annotation();
    if (!ann) return '';
    const r = ann.range;
    if (r?.kind === 'text' && r.selectedText) return r.selectedText;
    if (r?.kind === 'video' && r.fromSeconds != null) {
      return `Video segment from ${r.fromSeconds}s to ${r.toSeconds}s`;
    }
    const firstUser = ann.thread.find(m => m.role === 'user');
    return firstUser?.text ?? 'Shared discussion thread';
  }

  submitReply(): void {
    const ann  = this.annotation();
    const text = this.replyInput.trim();
    if (!ann || !text) return;

    this.replyLoading.set(true);
    this.replyError.set(null);
    this.newMessages.set(0);

    const obs$ = this.askAiToo
      ? this.annotationSvc.askAI(ann._id, {
          contentContext: this.contentContext,
          question:       text,
          tool:           ann.tool,
        }).pipe(map(r => r.annotation))
      : this.annotationSvc.addToThread(ann._id, text);

    obs$.subscribe({
      next: updated => {
        this.annotation.set(updated);
        this.replyInput = '';
        this._lastCount = updated.thread.length;
        this.replyLoading.set(false);
      },
      error: err => {
        if (err?.status === 401 || err?.status === 403) {
          this.replyError.set('You need to be logged in to reply.');
        } else {
          this.replyError.set('Failed to send reply. Please try again.');
        }
        this.replyLoading.set(false);
      },
    });
  }

  onReplyKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitReply();
    }
  }

  dismissNew(): void { this.newMessages.set(0); }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  get toolIcon(): string  { return this.toolMeta[this.annotation()?.tool ?? 'custom']?.icon ?? '🤖'; }
  get toolLabel(): string { return this.toolMeta[this.annotation()?.tool ?? 'custom']?.label ?? ''; }
  get contentLink(): string { return `/content/${this.annotation()?.contentId ?? ''}`; }

  trackMsg = (_: number, m: ThreadMessage) => m._id;
}
