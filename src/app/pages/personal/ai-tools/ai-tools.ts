import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { DiscussionChatComponent } from '../../../components/discussion-chat/discussion-chat';
import { ClaudeService } from '../../../services/claude.service';
import { CreatorToolsService } from '../../../services/creator-tools.service';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DiscussionChatComponent],
  templateUrl: './ai-tools.html',
  styleUrl: './ai-tools.scss'
})
export class AiToolsPage {
  private readonly claude = inject(ClaudeService);
  readonly creatorTools = inject(CreatorToolsService);
  private readonly router = inject(Router);

  isCreatePage(): boolean {
    if (typeof window !== 'undefined') {
      const urlPath = window.location.pathname + window.location.hash + window.location.search;
      return urlPath.includes('/personal/create') || urlPath.includes('/create');
    }
    return this.router.url.includes('/personal/create') || this.router.url.includes('/create');
  }

  isPersonalPage(): boolean {
    if (typeof window !== 'undefined') {
      const urlPath = window.location.pathname + window.location.hash;
      const cleanPath = urlPath.endsWith('/') ? urlPath.slice(0, -1) : urlPath;
      return cleanPath === '/personal' || cleanPath === '#/personal';
    }
    const cleanRouterUrl = this.router.url.split('?')[0];
    return cleanRouterUrl === '/personal' || cleanRouterUrl === '/personal/';
  }

  readonly blockTypes = [
    {
      type: 'text', label: 'Text', icon: '✍', desc: 'Atomic text segment',
      tools: [{ label: 'Gemini', link: 'https://gemini.google.com' },
      { label: 'Claude', link: 'https://claude.ai' },
      { label: 'ChatGPT', link: 'https://chatgpt.com' }
      ]
    },
    {
      type: 'code', label: 'Code', icon: '⌨', desc: 'Code architecture',
      tools: [{ label: 'Codeium', link: 'https://codeium.com/' },
      { label: 'GitHub Copilot', link: 'https://github.com/features/copilot' },
      { label: 'Claude Code', link: 'https://claude.ai/code' }
      ]
    },

    {
      type: 'image', label: 'Image', icon: '📸', desc: 'Visual media',
      tools: [{ label: 'DALL·E', link: 'https://openai.com/dall-e' },
      { label: 'Midjourney', link: 'https://midjourney.com/' },
      { label: 'Dall·E', link: 'https://blackforestlabs.ai' },
      ]
    },
    {
      type: 'video', label: 'Video', icon: '🎬', desc: 'Motion content',
      tools: [{ label: 'Sora', link: 'https://openart.ai/' },
      { label: 'Runway', link: 'https://runwayml.com' },
      { label: 'Pika', link: 'https://pika.art' }
      ]
    },
    {
      type: 'audio', label: 'Audio', icon: '🎵', desc: 'Sonic data',
      tools: [{ label: 'Endlesss', link: 'https://endlesss.fm/' },
      { label: 'Audacity', link: 'https://audacityteam.org/' },
      { label: 'Wisper', link: 'https://openai.com/research/whisper' }


      ]
    },
    { type: 'divider', label: 'Divider', icon: '―', desc: 'Logical break' },

    { type: 'columns', label: 'Columns', icon: '▤', desc: 'Multi-column layout' },
  ];

  // ── Chat Input ──────────────────────────────────────────────────────────────
  readonly messageText = signal('');

  sendMessage(): void {
    const message = this.messageText().trim();
    if (!message) return;
    // TODO: Implement message sending logic
    console.log('Message sent:', message);
    this.messageText.set('');
  }

  // ── Section toggle ──────────────────────────────────────────────────────────
  readonly expandedTool = signal<string | null>(null);
  toggleTool(name: string): void {
    this.expandedTool.update(v => v === name ? null : name);
  }

  // ── Ideas ───────────────────────────────────────────────────────────────────
  readonly ideasText = signal('');
  readonly ideasLoading = signal(false);

  fetchIdeas(): void {
    const title = this.creatorTools.sessionTitle() || this.creatorTools.sessionContentTitle();
    if (!title) return;
    this.ideasLoading.set(true);
    this.claude.askCoTeacher({
      userMessage: `For the topic "${title}" (content: ${this.creatorTools.sessionContentTitle() || 'general'}), share 5 recent research insights that would enrich this content. Numbered list, one concise paragraph each.`,
      contentContext: { title, category: this.creatorTools.sessionContentTitle() },
    }).subscribe({
      next: ({ data }) => { this.ideasText.set(data.reply); this.ideasLoading.set(false); },
      error: () => { this.ideasText.set('Unable to load ideas right now.'); this.ideasLoading.set(false); },
    });
  }

  // ── Update ──────────────────────────────────────────────────────────────────
  readonly updateTab = signal<'creator' | 'ai'>('creator');
  readonly updateSegmentId = signal('');
  readonly updateReplacement = signal('');
  readonly aiUpdateLoading = signal(false);
  readonly aiUpdateResult = signal('');

  applyCreatorUpdate(): void {
    const segId = this.updateSegmentId().trim();
    const rep = this.updateReplacement().trim();
    if (!segId || !rep) return;
    this.creatorTools.applyUpdate$.next({ segmentId: segId, replacement: rep });
    this.updateSegmentId.set('');
    this.updateReplacement.set('');
  }

  fetchAiUpdate(): void {
    const title = this.creatorTools.sessionTitle();
    if (!title) return;
    this.aiUpdateLoading.set(true);
    this.aiUpdateResult.set('');
    this.claude.askCoTeacher({
      userMessage: `For content titled "${title}", provide 3 research-backed updates. Each on one line: TARGET: [exact phrase to enhance] | UPDATE: [enriched replacement]`,
      contentContext: { title, category: this.creatorTools.sessionContentTitle() },
    }).subscribe({
      next: ({ data }) => {
        this.aiUpdateResult.set(data.reply);
        const lines = data.reply.split('\n').filter((l: string) => l.includes('TARGET:') && l.includes('UPDATE:'));
        for (const line of lines) {
          const segmentId = (line.match(/TARGET:\s*([^|]+)/)?.[1] ?? '').trim();
          const replacement = (line.match(/UPDATE:\s*(.+)/)?.[1] ?? '').trim();
          if (segmentId && replacement) this.creatorTools.applyUpdate$.next({ segmentId, replacement });
        }
        this.aiUpdateLoading.set(false);
      },
      error: () => { this.aiUpdateResult.set('AI update failed.'); this.aiUpdateLoading.set(false); },
    });
  }
}
