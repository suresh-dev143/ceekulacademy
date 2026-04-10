import {
  Component, OnInit, OnDestroy, OnChanges, SimpleChanges,
  Input, inject, signal, ViewChild, ElementRef, PLATFORM_ID, ChangeDetectorRef
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ChatService, ChatMessage, ChatSummary, ChatInsights
} from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector:    'app-live-chat',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './live-chat.html',
  styleUrls:   ['./live-chat.scss']
})
export class LiveChatComponent implements OnInit, OnDestroy, OnChanges {

  @Input() lectureId    = '';
  @Input() lectureTitle = '';
  @Input() isTeacher    = false;

  @ViewChild('messageList') messageListEl!: ElementRef<HTMLDivElement>;
  @ViewChild('chatInput')   chatInputEl!:   ElementRef<HTMLInputElement>;

  private chat       = inject(ChatService);
  private auth       = inject(AuthService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);
  private subs       = new Subscription();

  // ── State ─────────────────────────────────────────────────────────────────
  messages      = signal<ChatMessage[]>([]);
  connected     = signal(false);
  inputText     = '';
  sending       = signal(false);
  blockedReason = signal('');

  // AI panel
  activeTab   = signal<'chat' | 'summary' | 'insights'>('chat');
  summary     = signal<ChatSummary | null>(null);
  insights    = signal<ChatInsights | null>(null);
  summaryLoading  = signal(false);
  insightsLoading = signal(false);

  // Moderation notification
  showBlocked = signal(false);

  ngOnInit(): void {
    if (!this.isBrowser || !this.lectureId) return;
    this._connect();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lectureId'] && !changes['lectureId'].firstChange) {
      this.chat.disconnect();
      this._connect();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.chat.disconnect();
  }

  private _connect(): void {
    const user = this.auth.currentUserProfile() || null;
    this.chat.connect(
      this.lectureId,
      user?.id     ?? 'anon',
      user?.name    ?? 'Anonymous',
      this.isTeacher ? 'teacher' : 'student',
      this.lectureTitle
    );

    this.subs.add(this.chat.connected$.subscribe(c => {
      this.connected.set(c);
      this.cdr.markForCheck();
    }));

    this.subs.add(this.chat.messages$.subscribe(msgs => {
      this.messages.set(msgs);
      this.cdr.markForCheck();
      this._scrollToBottom();
    }));

    this.subs.add(this.chat.summary$.subscribe(s => {
      this.summary.set(s);
      this.summaryLoading.set(false);
      this.cdr.markForCheck();
    }));

    this.subs.add(this.chat.insights$.subscribe(i => {
      this.insights.set(i);
      this.insightsLoading.set(false);
      this.cdr.markForCheck();
    }));

    this.subs.add(this.chat.blocked$.subscribe(b => {
      this.blockedReason.set(b.reason);
      this.showBlocked.set(true);
      setTimeout(() => this.showBlocked.set(false), 4000);
      this.cdr.markForCheck();
    }));
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text || !this.connected()) return;
    this.chat.sendMessage(text);
    this.inputText = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  requestSummary(): void {
    if (!this.isTeacher) return;
    this.summaryLoading.set(true);
    this.activeTab.set('summary');
    this.chat.requestSummary();
  }

  requestInsights(): void {
    if (!this.isTeacher) return;
    this.insightsLoading.set(true);
    this.activeTab.set('insights');
    this.chat.requestInsights();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  getModerationClass(msg: ChatMessage): string {
    return msg.moderation?.status === 'flagged' ? 'flagged' : '';
  }

  getSentimentIcon(s: string): string {
    return s === 'positive' ? '😊' : s === 'negative' ? '😟' : '';
  }

  getEngagementColor(level: string): string {
    return level === 'high' ? '#4ade80' : level === 'medium' ? '#fbbf24' : '#f87171';
  }

  private _scrollToBottom(): void {
    if (!this.isBrowser) return;
    setTimeout(() => {
      const el = this.messageListEl?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
