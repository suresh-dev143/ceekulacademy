import {
  Component, inject, signal, effect, ElementRef, ViewChild, OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ScreenSyncService } from '../../services/screen-sync.service';
import { PartitionService } from '../../services/partition.service';
import { environment } from '../../../environments/environment';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

@Component({
  selector: 'app-claude-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './claude-panel.component.html',
  styleUrl: './claude-panel.component.scss',
})
export class ClaudePanelComponent implements OnInit {

  private readonly http      = inject(HttpClient);
  private readonly sync      = inject(ScreenSyncService);
  private readonly partition = inject(PartitionService);

  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;

  readonly messages  = signal<ChatMessage[]>([]);
  readonly draft     = signal('');
  readonly loading   = signal(false);
  readonly context   = signal('home');

  ngOnInit(): void {
    const ctx = this.sync.lastSync()?.context ?? 'home';
    this.context.set(ctx);
    this.messages.set([{
      role: 'assistant',
      text: `Context: **${ctx}**. Ask me anything about what you're working on.`,
    }]);
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.loading()) return;

    this.messages.update(m => [...m, { role: 'user', text }]);
    this.draft.set('');
    this.loading.set(true);

    const panelContents = this._getPanelContents();
    this.http.post<{ reply: string }>(
      `${environment.apiUrl}/api/ai/assist`,
      { message: text, context: this.context(), panelContents },
    ).subscribe({
      next: (res) => {
        this.messages.update(m => [...m, { role: 'assistant', text: res.reply }]);
        this.loading.set(false);
        this._scroll();
      },
      error: (err) => {
        this.messages.update(m => [...m, {
          role: 'assistant',
          text: `Error: ${err.error?.error ?? 'request failed'}`,
        }]);
        this.loading.set(false);
      },
    });
  }

  onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _getPanelContents(): string[] {
    const leaves: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (node: any) => {
      if (node.kind === 'leaf' && node.content !== 'ai') leaves.push(node.content);
      else if (node.children) node.children.forEach(walk);
    };
    walk(this.partition.root());
    return leaves;
  }

  private _scroll(): void {
    setTimeout(() => this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 50);
  }
}
