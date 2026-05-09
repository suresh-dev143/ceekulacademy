import {
  Component, Input, OnInit, OnDestroy, inject, signal, computed,
  ElementRef, ViewChild, PLATFORM_ID, effect
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DiscussionService, DiscussionRoom, DiscussionMessage, CreateRoomPayload } from '../../services/discussion.service';
import { AuthService } from '../../services/auth.service';
import { DqrgComponent } from '../dqrg/dqrg';

@Component({
  selector: 'app-discussion-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, DqrgComponent],
  templateUrl: './discussion-chat.html',
  styleUrl: './discussion-chat.scss'
})
export class DiscussionChatComponent implements OnInit, OnDestroy {

  @Input() contextId?:       string;
  @Input() contextType?:     string;
  @Input() contentTitle?:    string;
  @Input() contentSummary?:  string;
  @Input() contentCategory?: string;
  @Input() placeholder = 'Join a discussion...';

  // Panel toggle: 'discuss' = discussion rooms, 'dqrg' = AI intelligence
  readonly panel = signal<'discuss' | 'dqrg'>('discuss');

  @ViewChild('messageList') private messageList!: ElementRef<HTMLDivElement>;

  readonly discussion = inject(DiscussionService);
  readonly auth       = inject(AuthService);
  private platformId  = inject(PLATFORM_ID);
  private isBrowser   = isPlatformBrowser(this.platformId);

  // ── UI state ───────────────────────────────────────────────────────────────
  readonly view           = signal<'rooms' | 'chat' | 'create'>('rooms');
  readonly inputText      = signal('');
  readonly sending        = signal(false);
  readonly newRoomTitle   = signal('');
  readonly newRoomTopic   = signal('');
  readonly newRoomType    = signal<'public' | 'group' | 'contextual'>('public');
  readonly typingNames    = signal<string[]>([]);
  readonly onlineCount    = signal(0);

  // ── Projected streams ──────────────────────────────────────────────────────
  readonly rooms    = this.discussion.rooms$;
  readonly room     = this.discussion.activeRoom$;
  readonly messages = this.discussion.messages$;
  readonly connected = this.discussion.connected$;

  readonly canSend = computed(() => this.inputText().trim().length > 0 && !this.sending());

  private subs = new Subscription();
  private typingTimer?: ReturnType<typeof setTimeout>;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const user = this.auth.currentUserProfile();
    if (user) {
      this.discussion.connect(user.id, user.name, user.role?.toLowerCase() ?? 'member');
    } else {
      this.discussion.connect('guest', 'Guest', 'guest');
    }

    this.subs.add(
      this.discussion.activeRoom$.subscribe(room => {
        if (room) {
          this.view.set('chat');
          this.typingNames.set([]);
        }
      })
    );

    this.subs.add(
      this.discussion.messages$.subscribe(() => {
        setTimeout(() => this._scrollToBottom(), 50);
      })
    );

    this.subs.add(
      this.discussion.typing$.subscribe(({ userName, isTyping }) => {
        this.typingNames.update(names => {
          const without = names.filter(n => n !== userName);
          return isTyping ? [...without, userName] : without;
        });
      })
    );

    this.subs.add(
      this.discussion.participants$.subscribe(({ onlineCount }) => {
        this.onlineCount.set(onlineCount);
      })
    );

    this.subs.add(
      this.discussion.error$.subscribe(({ message }) => {
        console.warn('[DiscussionChat] error:', message);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    clearTimeout(this.typingTimer);
    this.discussion.disconnect();
  }

  // ── Room list ──────────────────────────────────────────────────────────────

  openRoom(room: DiscussionRoom): void {
    this.discussion.joinRoom(room._id);
  }

  backToRooms(): void {
    this.discussion.leaveRoom();
    this.view.set('rooms');
    this.onlineCount.set(0);
  }

  openCreate(): void { this.view.set('create'); }
  closeCreate(): void { this.view.set('rooms'); }

  // ── Room creation ──────────────────────────────────────────────────────────

  submitCreate(): void {
    const title = this.newRoomTitle().trim();
    if (!title) return;

    const payload: CreateRoomPayload = {
      type:  this.newRoomType(),
      title,
      topic: this.newRoomTopic().trim() || undefined
    };
    if (this.contextId)   payload.contextId   = this.contextId;
    if (this.contextType) payload.contextType = this.contextType;

    this.discussion.createRoom(payload);
    this.newRoomTitle.set('');
    this.newRoomTopic.set('');
    this.view.set('rooms');
  }

  // ── Messaging ──────────────────────────────────────────────────────────────

  sendMessage(): void {
    const content = this.inputText().trim();
    if (!content || this.sending()) return;

    this.sending.set(true);
    this.discussion.sendMessage(content);
    this.inputText.set('');
    this.sending.set(false);
    this.discussion.sendTyping(false);
  }

  onInputChange(value: string): void {
    this.inputText.set(value);
    this.discussion.sendTyping(true);
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => this.discussion.sendTyping(false), 2000);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isOwn(msg: DiscussionMessage): boolean {
    const user = this.auth.currentUserProfile();
    return msg.senderId === (user?.id ?? '');
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  trackByMsgId(_: number, msg: DiscussionMessage): string { return msg._id; }
  trackByRoomId(_: number, room: DiscussionRoom): string  { return room._id; }

  private _scrollToBottom(): void {
    if (!this.messageList) return;
    const el = this.messageList.nativeElement;
    el.scrollTop = el.scrollHeight;
  }
}
