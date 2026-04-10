import {
  Component, OnInit, OnDestroy, inject, signal,
  ViewChild, ElementRef, PLATFORM_ID, ChangeDetectorRef
} from '@angular/core';
import { isPlatformBrowser, CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { ActivatedRoute }     from '@angular/router';
import { Subscription, throttleTime } from 'rxjs';
import { AuthService }        from '../../services/auth.service';
import {
  LiveEditorService, Participant, AiSuggestion,
  SuggestionType, CursorEvent, HighlightEvent, CommitEvent
} from '../../services/live-editor.service';

interface Segment {
  order:          number;
  type:           string;
  title:          string;
  content:        string;
  cognitiveTarget: string;
}

interface PendingRequest {
  requestId:     string;
  type:          SuggestionType;
  selectedText:  string;
  loading:       boolean;
}

interface RemoteCursor {
  userId:   string;
  userName: string;
  role:     string;
  position: number;
  color:    string;
}

const CURSOR_COLORS = ['#f472b6','#34d399','#60a5fa','#fbbf24','#a78bfa','#fb923c'];

const SUGGESTION_MENU: { type: SuggestionType; label: string; icon: string; hint: string }[] = [
  { type: 'explain',  label: 'Explain',  icon: '💬', hint: 'Plain-language explanation' },
  { type: 'example',  label: 'Example',  icon: '💡', hint: 'Concrete real-world example' },
  { type: 'visual',   label: 'Visual',   icon: '🖼️', hint: 'Diagram / visual aid description' },
  { type: 'simplify', label: 'Simplify', icon: '🟢', hint: 'Rewrite in simpler language' },
  { type: 'expand',   label: 'Expand',   icon: '🔵', hint: 'Add depth and nuance' },
  { type: 'question', label: 'Question', icon: '❓', hint: 'Socratic comprehension question' },
];

@Component({
  selector:    'app-live-editor',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './live-editor.html',
  styleUrls:   ['./live-editor.scss']
})
export class LiveEditorComponent implements OnInit, OnDestroy {

  @ViewChild('editorArea') editorArea!: ElementRef<HTMLTextAreaElement>;

  private route      = inject(ActivatedRoute);
  private auth       = inject(AuthService);
  private editor     = inject(LiveEditorService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  lectureId   = '';
  isTeacher   = true;    // derived from auth role
  private subs = new Subscription();

  // ── Editor state ──────────────────────────────────────────────────────────
  segments       = signal<Segment[]>([]);
  activeIndex    = signal(0);
  loading        = signal(true);
  connected      = signal(false);
  saving         = signal(false);

  // ── Participants ──────────────────────────────────────────────────────────
  participants   = signal<Participant[]>([]);
  remoteCursors  = new Map<string, RemoteCursor>();

  // ── AI suggestion panel ───────────────────────────────────────────────────
  selectedText   = signal('');
  selectionRange = signal<{ start: number; end: number } | null>(null);
  showSuggMenu   = signal(false);
  pendingRequest = signal<PendingRequest | null>(null);
  suggestions    = signal<AiSuggestion[]>([]);
  readonly MENU  = SUGGESTION_MENU;

  // ── Highlights / annotations ──────────────────────────────────────────────
  highlights     = signal<HighlightEvent[]>([]);

  get activeSegment(): Segment | null {
    return this.segments()[this.activeIndex()] ?? null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.lectureId = this.route.snapshot.paramMap.get('lectureId') ?? '';
    this.isTeacher = this.auth.currentUserProfile()?.role === 'Teacher';

    // Load content via REST first, then open WS
    this.editor.getContent(this.lectureId).subscribe({
      next: res => {
        this.segments.set(res.data.segments ?? []);
        this.loading.set(false);
        this.openSocket();
      },
      error: () => this.loading.set(false)
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.editor.disconnect();
  }

  // ── Socket connection ─────────────────────────────────────────────────────

  private openSocket(): void {
    const user = this.auth.currentUserProfile() || null;
    this.editor.connect(
      this.lectureId,
      user?.id ?? '',
      user?.name ?? 'Anonymous',
      this.isTeacher ? 'teacher' : 'student'
    );

    this.subs.add(this.editor.connected$.subscribe(c => this.connected.set(c)));
    this.subs.add(this.editor.participants$.subscribe(p => this.participants.set(p)));

    // Remote ops — apply to local segment content
    this.subs.add(this.editor.op$.subscribe(op => this.applyRemoteOp(op)));

    // Remote cursors
    this.subs.add(
      this.editor.cursor$.pipe(throttleTime(50)).subscribe(c => this.handleRemoteCursor(c))
    );

    // Highlights
    this.subs.add(this.editor.highlight$.subscribe(hl => {
      this.highlights.update(list => [...list, hl]);
    }));

    // AI suggestions
    this.subs.add(this.editor.suggestion$.subscribe(s => {
      this.pendingRequest.set(null);
      this.suggestions.update(list => [s, ...list].slice(0, 10));
      this.cdr.markForCheck();
    }));

    this.subs.add(this.editor.suggestionErr$.subscribe(() => {
      this.pendingRequest.set(null);
    }));

    // Remote commits (student view updates)
    this.subs.add(this.editor.commit$.subscribe(evt => {
      if (!this.isTeacher) this.applyCommit(evt);
    }));
  }

  // ── Segment navigation ────────────────────────────────────────────────────

  selectSegment(index: number): void {
    // Auto-commit current segment before switching
    if (this.isTeacher && this.activeSegment) {
      this.commitSegment();
    }
    this.activeIndex.set(index);
    this.suggestions.set([]);
    this.highlights.set([]);
    this.showSuggMenu.set(false);
    this.selectedText.set('');
  }

  // ── Teacher text editing ──────────────────────────────────────────────────

  onContentInput(event: Event): void {
    if (!this.isTeacher) return;
    const ta    = event.target as HTMLTextAreaElement;
    const order = this.activeSegment?.order;
    if (!order) return;

    // Update local model
    this.segments.update(segs =>
      segs.map(s => s.order === order ? { ...s, content: ta.value } : s)
    );

    // Broadcast op (replace whole content for simplicity; OT not needed for single-teacher model)
    this.editor.emitOp({
      segmentOrder: order,
      type:         'replace',
      position:     0,
      text:         ta.value,
      length:       ta.value.length
    });
  }

  onSelectionChange(): void {
    if (!this.isTeacher || !this.editorArea) return;
    const ta    = this.editorArea.nativeElement;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;

    if (start === end) {
      this.selectedText.set('');
      this.selectionRange.set(null);
      this.showSuggMenu.set(false);
      return;
    }

    const text = ta.value.substring(start, end);
    this.selectedText.set(text);
    this.selectionRange.set({ start, end });
    this.showSuggMenu.set(true);
  }

  onCursorMove(): void {
    if (!this.editorArea || !this.activeSegment) return;
    const ta = this.editorArea.nativeElement;
    this.editor.emitCursor(
      this.activeSegment.order,
      ta.selectionStart,
      { start: ta.selectionStart, end: ta.selectionEnd }
    );
  }

  commitSegment(): void {
    const seg = this.activeSegment;
    if (!seg || !this.isTeacher) return;
    this.saving.set(true);
    this.editor.commitSegment(seg.order, seg.content);
    setTimeout(() => this.saving.set(false), 800);
  }

  // ── AI suggestion workflow ────────────────────────────────────────────────

  requestSuggestion(type: SuggestionType): void {
    const text = this.selectedText();
    if (!text || !this.activeSegment) return;

    this.showSuggMenu.set(false);
    const requestId = this.editor.requestSuggestion({
      segmentOrder:   this.activeSegment.order,
      selectedText:   text,
      suggestionType: type
    });

    this.pendingRequest.set({ requestId, type, selectedText: text, loading: true });
  }

  acceptSuggestion(s: AiSuggestion): void {
    const seg = this.activeSegment;
    if (!seg) return;

    let newContent = seg.content;
    const { suggestion, insertionHint, selectedText } = s;

    if (insertionHint === 'replace') {
      newContent = newContent.replace(selectedText, suggestion);
    } else if (insertionHint === 'after') {
      newContent = newContent.replace(selectedText, selectedText + '\n\n' + suggestion);
    } else {
      newContent = newContent.replace(selectedText, suggestion + '\n\n' + selectedText);
    }

    this.segments.update(segs =>
      segs.map(s => s.order === seg.order ? { ...s, content: newContent } : s)
    );

    this.editor.emitOp({ segmentOrder: seg.order, type: 'replace', position: 0,
      text: newContent, length: newContent.length });

    this.commitSegment();
    this.dismissSuggestion(s.requestId);
  }

  dismissSuggestion(requestId: string): void {
    this.suggestions.update(list => list.filter(s => s.requestId !== requestId));
  }

  addHighlight(type: 'note' | 'question' | 'highlight'): void {
    const range = this.selectionRange();
    if (!range || !this.activeSegment) return;
    this.editor.emitHighlight({
      segmentOrder: this.activeSegment.order,
      start:        range.start,
      end:          range.end,
      type,
      text:         this.selectedText()
    });
    this.showSuggMenu.set(false);
  }

  // ── Remote op application ─────────────────────────────────────────────────

  private applyRemoteOp(op: any): void {
    if (op.type === 'replace') {
      this.segments.update(segs =>
        segs.map(s => s.order === op.segmentOrder ? { ...s, content: op.text } : s)
      );
    }
  }

  private applyCommit(evt: CommitEvent): void {
    this.segments.update(segs =>
      segs.map(s => s.order === evt.segmentOrder ? { ...s, content: evt.newContent } : s)
    );
  }

  private handleRemoteCursor(c: CursorEvent): void {
    const existing = this.remoteCursors.get(c.userId);
    this.remoteCursors.set(c.userId, {
      userId:   c.userId,
      userName: c.userName,
      role:     c.role,
      position: c.position,
      color:    existing?.color ?? CURSOR_COLORS[this.remoteCursors.size % CURSOR_COLORS.length]
    });
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  getParticipantInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  getSegmentTypeColor(type: string): string {
    const map: Record<string, string> = {
      concept: '#60a5fa', example: '#34d399', case_study: '#f472b6',
      quiz: '#fbbf24', summary: '#a78bfa'
    };
    return map[type] ?? '#94a3b8';
  }

  getSuggestionTypeColor(type: string): string {
    const map: Record<string, string> = {
      explain: '#60a5fa', example: '#34d399', visual: '#f472b6',
      simplify: '#4ade80', expand: '#818cf8', question: '#fbbf24'
    };
    return map[type] ?? '#94a3b8';
  }
}
