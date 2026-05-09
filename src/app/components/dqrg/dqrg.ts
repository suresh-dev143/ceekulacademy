import {
  Component, Input, OnChanges, SimpleChanges, OnDestroy,
  inject, signal, computed, ElementRef, ViewChild, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClaudeService, DqrgMode, DqrgMessage } from '../../services/claude.service';
import { DQRG_MIME, DqrgDragPayload } from './dqrg-draggable.directive';

export interface ParsedReply {
  insight: string;
  cidRef?: string;
  nextAction?: string;
}

export interface DqrgThread {
  role: 'user' | 'assistant';
  content: string;
  mode: DqrgMode;
  timestamp: Date;
  parsed?: ParsedReply;
}

interface DroppedContext {
  cid:      string;
  title:    string;
  summary:  string;
  category: string;
}

const MODE_META: Record<DqrgMode, { label: string; color: string; icon: string; hint: string }> = {
  DISCUSS:  { label: 'Discuss',  color: 'blue',   icon: 'D', hint: 'Deep understanding & analogies' },
  QUESTION: { label: 'Question', color: 'purple', icon: 'Q', hint: 'Break into sub-questions' },
  RESEARCH: { label: 'Research', color: 'teal',   icon: 'R', hint: 'Synthesise ideas & connections' },
  GRADE:    { label: 'Grade',    color: 'amber',  icon: 'G', hint: 'Evaluate your understanding' }
};

@Component({
  selector: 'app-dqrg',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dqrg.html',
  styleUrl: './dqrg.scss'
})
export class DqrgComponent implements OnChanges, OnDestroy {

  @Input() cid             = '';
  @Input() cidVersion?: number;
  @Input() contentTitle    = '';
  @Input() contentSummary  = '';
  @Input() contentCategory = '';

  @ViewChild('threadEl') private threadEl!: ElementRef<HTMLDivElement>;

  private claude     = inject(ClaudeService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  readonly mode         = signal<DqrgMode>('DISCUSS');
  readonly thread       = signal<DqrgThread[]>([]);
  readonly input        = signal('');
  readonly thinking     = signal(false);
  readonly resetAnim    = signal(false);
  readonly dragOver     = signal(false);
  readonly droppedCtx   = signal<DroppedContext | null>(null);

  readonly modes = Object.entries(MODE_META) as [DqrgMode, typeof MODE_META[DqrgMode]][];

  // Resolved values: dropped context overrides @Input() props
  readonly activeCid      = computed(() => this.droppedCtx()?.cid      || this.cid);
  readonly activeTitle    = computed(() => this.droppedCtx()?.title     || this.contentTitle);
  readonly activeSummary  = computed(() => this.droppedCtx()?.summary   || this.contentSummary);
  readonly activeCategory = computed(() => this.droppedCtx()?.category  || this.contentCategory);

  readonly modeMeta = computed(() => MODE_META[this.mode()]);
  readonly canSend  = computed(() => this.input().trim().length > 0 && !this.thinking());
  readonly cidShort = computed(() => {
    const c = this.activeCid();
    return c ? c.slice(0, 14) + '…' : '';
  });
  readonly isEmpty  = computed(() => this.thread().length === 0);
  readonly hasDroppedCtx = computed(() => this.droppedCtx() !== null);

  private sub?: Subscription;
  private lastCid = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cid'] && this.cid !== this.lastCid && this.cid) {
      this.lastCid = this.cid;
      // Only reset if no manually dropped context is active
      if (!this.droppedCtx()) this._resetContext();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  setMode(m: DqrgMode): void {
    this.mode.set(m);
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    this.dragOver.set(true);
  }

  onDragLeave(e: DragEvent): void {
    // Only clear if leaving the container itself, not a child
    const el = (e.currentTarget as HTMLElement);
    if (!el.contains(e.relatedTarget as Node)) {
      this.dragOver.set(false);
    }
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver.set(false);
    if (!e.dataTransfer) return;

    // ── Case 1: CID payload from dqrgDraggable ──────────────────────────────
    const cidJson = e.dataTransfer.getData(DQRG_MIME);
    if (cidJson) {
      try {
        const payload = JSON.parse(cidJson) as DqrgDragPayload;
        if (payload.cid && payload.cid !== this.activeCid()) {
          this.droppedCtx.set({
            cid:      payload.cid,
            title:    payload.title    ?? '',
            summary:  payload.summary  ?? '',
            category: payload.category ?? ''
          });
          this._resetContext();
        }
      } catch { /* malformed JSON — ignore */ }
      return;
    }

    // ── Case 2: Plain text selection dragged in — pre-fill input ───────────
    const text = e.dataTransfer.getData('text/plain').trim();
    if (text) {
      // If text looks like a bare CID, treat as CID drop
      if (/^ck_[a-f0-9]{20,}$/.test(text)) {
        this.droppedCtx.set({ cid: text, title: '', summary: '', category: '' });
        this._resetContext();
      } else {
        // Append to or set input — user dragged a quote/selection to ask about
        const current = this.input().trim();
        this.input.set(current ? `${current}\n\n${text}` : text);
      }
    }
  }

  clearDroppedCtx(): void {
    this.droppedCtx.set(null);
    this._resetContext();
  }

  // ── Chat ───────────────────────────────────────────────────────────────────

  send(): void {
    const text = this.input().trim();
    if (!text || this.thinking()) return;

    this.thread.update(t => [...t, {
      role: 'user', content: text, mode: this.mode(), timestamp: new Date()
    }]);
    this.input.set('');
    this.thinking.set(true);
    this._scrollToBottom();

    const history: DqrgMessage[] = this.thread()
      .slice(-12)
      .filter(t => t.role !== 'user' || t.content !== text)
      .map(t => ({ role: t.role, content: t.content }));

    this.sub?.unsubscribe();
    this.sub = this.claude.dqrgChat({
      cid:                this.activeCid(),
      cidVersion:         this.cidVersion,
      dqrgMode:           this.mode(),
      userMessage:        text,
      contentContext:     {
        title:    this.activeTitle(),
        summary:  this.activeSummary(),
        category: this.activeCategory()
      },
      interactionHistory: history
    }).subscribe({
      next: res => {
        const reply = res.data.reply;
        this.thread.update(t => [...t, {
          role: 'assistant', content: reply, mode: this.mode(),
          timestamp: new Date(), parsed: this.parseReply(reply)
        }]);
        this.thinking.set(false);
        setTimeout(() => this._scrollToBottom(), 50);
      },
      error: () => {
        this.thread.update(t => [...t, {
          role: 'assistant',
          content: 'I encountered an error. Please try again.',
          mode: this.mode(),
          timestamp: new Date()
        }]);
        this.thinking.set(false);
      }
    });
  }

  onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  clearThread(): void {
    this.thread.set([]);
  }

  private parseReply(content: string): ParsedReply {
    const insightMatch   = content.match(/Key Insight:\s*([\s\S]+?)(?=\nCID Reference:|\nNext Action:|$)/i);
    const cidRefMatch    = content.match(/CID Reference:\s*(.+)/i);
    const nextActMatch   = content.match(/Next Action:\s*(.+)/i);
    const insight = insightMatch?.[1]?.trim() ?? content.trim();
    return {
      insight,
      cidRef:     cidRefMatch?.[1]?.trim()  || undefined,
      nextAction: nextActMatch?.[1]?.trim() || undefined,
    };
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  trackBy(_: number, item: DqrgThread): string {
    return item.timestamp.getTime().toString();
  }

  private _resetContext(): void {
    this.sub?.unsubscribe();
    this.thread.set([]);
    this.input.set('');
    this.thinking.set(false);
    this.resetAnim.set(true);
    setTimeout(() => this.resetAnim.set(false), 600);
  }

  private _scrollToBottom(): void {
    if (!this.isBrowser || !this.threadEl) return;
    const el = this.threadEl.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
