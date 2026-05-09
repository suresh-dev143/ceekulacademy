import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DiscussionChatComponent } from '../../../components/discussion-chat/discussion-chat';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [CommonModule, RouterLink, DiscussionChatComponent],
  templateUrl: './ai-tools.html',
  styleUrl: './ai-tools.scss'
})
export class AiToolsPage {

  readonly tools = [
    { name: 'Content Creation',      desc: 'Generate engaging content'   },
    { name: 'Learning & Innovation', desc: 'Brainstorming & Growth'      },
    { name: 'Research Questions',    desc: 'Deep Inquiry'                 },
    { name: 'Right Thinking Tools',  desc: 'Cognitive Frameworks'        },
    { name: 'Project Development',   desc: 'Architecture & Planning'     },
    { name: 'Online Production',     desc: 'Digital Media Creation'      },
  ];

  readonly blockTypes = [
    { type: 'text',    label: 'Text',    icon: '✍',  desc: 'Atomic text segment' },
    { type: 'code',    label: 'Code',    icon: '⌨',  desc: 'Code architecture'   },
    { type: 'image',   label: 'Image',   icon: '📸', desc: 'Visual media'        },
    { type: 'video',   label: 'Video',   icon: '🎬', desc: 'Motion content'      },
    { type: 'audio',   label: 'Audio',   icon: '🎵', desc: 'Sonic data'          },
    { type: 'divider', label: 'Divider', icon: '―',  desc: 'Logical break'       },
    { type: 'columns', label: 'Columns', icon: '▤',  desc: 'Multi-column layout' },
  ];

  readonly expandedTool = signal<string | null>(null);

  toggleTool(name: string): void {
    this.expandedTool.update(current => current === name ? null : name);
  }
}
