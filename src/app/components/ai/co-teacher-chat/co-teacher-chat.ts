import {
  Component, signal, inject, Input, ViewChild, ElementRef, AfterViewChecked, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClaudeService } from '../../../services/claude.service';
import { DigitalTwinService } from '../../../services/digital-twin.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  loading?: boolean;
}

@Component({
  selector: 'app-co-teacher-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="co-teacher-panel">
      <div class="ct-header">
        <div class="ct-avatar">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#6366f1" opacity=".15"/>
            <path d="M8 12h8M12 8v8" stroke="#6366f1" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <p class="ct-name">AI Co-Teacher</p>
          <p class="ct-sub">Powered by Claude · {{ levelLabel() }}</p>
        </div>
      </div>

      <div class="ct-messages" #scrollRef>
        @if (messages().length === 0) {
          <div class="ct-empty">
            <p>Ask me anything about this lecture.<br>I'll adapt to your level.</p>
          </div>
        }
        @for (msg of messages(); track msg.timestamp.getTime() + msg.role) {
          <div class="ct-bubble" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
            @if (msg.loading) {
              <span class="ct-dots"><span></span><span></span><span></span></span>
            } @else {
              <p>{{ msg.text }}</p>
            }
            <span class="ct-time">{{ msg.timestamp | date:'HH:mm' }}</span>
          </div>
        }
      </div>

      <div class="ct-input-row">
        <input
          [(ngModel)]="userInput"
          (keydown.enter)="send()"
          placeholder="Ask a question..."
          [disabled]="sending()"
          class="ct-input"
        />
        <button (click)="send()" [disabled]="sending() || !userInput.trim()" class="ct-send">
          @if (sending()) {
            <span class="ct-spin"></span>
          } @else {
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .co-teacher-panel {
      display: flex; flex-direction: column; height: 100%;
      background: #0f0f1a; border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(99,102,241,.2);
    }
    .ct-header {
      display: flex; align-items: center; gap: 10px; padding: 14px 16px;
      border-bottom: 1px solid rgba(255,255,255,.06); background: rgba(99,102,241,.05);
    }
    .ct-avatar { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
      background: rgba(99,102,241,.1); border-radius: 50%; }
    .ct-name { font-size: 13px; font-weight: 600; color: #e2e8f0; margin: 0; }
    .ct-sub { font-size: 11px; color: #94a3b8; margin: 0; }
    .ct-messages {
      flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px;
    }
    .ct-empty { text-align: center; color: #475569; font-size: 13px; margin: auto;
      line-height: 1.6; padding: 20px; }
    .ct-bubble {
      max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.55;
    }
    .ct-bubble.user { align-self: flex-end; background: #6366f1; color: #fff; border-bottom-right-radius: 4px; }
    .ct-bubble.assistant { align-self: flex-start; background: rgba(255,255,255,.06);
      color: #e2e8f0; border-bottom-left-radius: 4px; }
    .ct-bubble p { margin: 0 0 4px; }
    .ct-time { font-size: 10px; opacity: .5; }
    .ct-input-row { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(255,255,255,.06); }
    .ct-input {
      flex: 1; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
      border-radius: 8px; padding: 9px 12px; color: #e2e8f0; font-size: 13px; outline: none;
    }
    .ct-input:focus { border-color: #6366f1; }
    .ct-send {
      width: 38px; height: 38px; background: #6366f1; border: none; border-radius: 8px;
      color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity .2s;
    }
    .ct-send:disabled { opacity: .4; cursor: default; }
    .ct-dots span {
      display: inline-block; width: 6px; height: 6px; background: #94a3b8; border-radius: 50%;
      margin: 0 2px; animation: bounce .8s infinite alternate;
    }
    .ct-dots span:nth-child(2) { animation-delay: .2s; }
    .ct-dots span:nth-child(3) { animation-delay: .4s; }
    @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-5px); } }
    .ct-spin {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class CoTeacherChatComponent implements AfterViewChecked, OnInit {
  @Input() sessionId?: string;
  @Input() contentTitle?: string;
  @Input() contentCategory?: string;

  @ViewChild('scrollRef') private scrollRef!: ElementRef;

  private claudeSvc = inject(ClaudeService);
  private twinSvc   = inject(DigitalTwinService);

  messages = signal<ChatMessage[]>([]);
  sending  = signal(false);
  userInput = '';

  levelLabel() {
    const lvl = this.twinSvc.twin()?.cognitiveProfile?.level ?? 'beginner';
    return lvl.charAt(0).toUpperCase() + lvl.slice(1) + ' level';
  }

  ngOnInit() {
    if (!this.twinSvc.twin()) {
      this.twinSvc.loadMyTwin().subscribe();
    }
    this.messages.set([{
      role: 'assistant',
      text: 'Hi! I\'m your AI co-teacher. Ask me anything about this lecture and I\'ll tailor my explanation to your level.',
      timestamp: new Date()
    }]);
  }

  ngAfterViewChecked() {
    this._scrollToBottom();
  }

  send() {
    const text = this.userInput.trim();
    if (!text || this.sending()) return;

    this.messages.update(m => [...m, { role: 'user', text, timestamp: new Date() }]);
    this.userInput = '';
    this.sending.set(true);

    const loadingMsg: ChatMessage = { role: 'assistant', text: '', timestamp: new Date(), loading: true };
    this.messages.update(m => [...m, loadingMsg]);

    this.claudeSvc.askCoTeacher({
      sessionId:      this.sessionId,
      userMessage:    text,
      contentContext: { title: this.contentTitle, category: this.contentCategory }
    }).subscribe({
      next: res => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = {
            role: 'assistant', text: res.data.reply, timestamp: new Date()
          };
          return updated;
        });
        this.sending.set(false);
      },
      error: () => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[updated.length - 1] = {
            role: 'assistant', text: 'Sorry, I\'m having trouble connecting right now. Try again in a moment.', timestamp: new Date()
          };
          return updated;
        });
        this.sending.set(false);
      }
    });
  }

  private _scrollToBottom() {
    try {
      const el = this.scrollRef?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
