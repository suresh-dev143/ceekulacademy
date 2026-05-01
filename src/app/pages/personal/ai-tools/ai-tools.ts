import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscussionChatComponent } from '../../../components/discussion-chat/discussion-chat';

@Component({
  selector: 'app-ai-tools',
  standalone: true,
  imports: [CommonModule, DiscussionChatComponent],
  templateUrl: './ai-tools.html',
  styleUrl: './ai-tools.scss'
})
export class AiToolsPage {
  readonly tools = [
    { name: 'Social Media', desc: 'Strategy & Content' },
    { name: 'Learning & Innovation', desc: 'Brainstorming & Growth' },
    { name: 'Research Questions', desc: 'Deep Inquiry' },
    { name: 'Right Thinking Tools', desc: 'Cognitive Frameworks' },
    { name: 'Project Development', desc: 'Architecture & Planning' },
    { name: 'Online Production', desc: 'Digital Media Creation' }
  ];
}
