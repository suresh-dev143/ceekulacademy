import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrchestratorService } from '../../services/orchestrator.service';

@Component({
  selector: 'app-chat-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="messages" #scrollMe [scrollTop]="scrollMe.scrollHeight">
        <div *ngFor="let msg of messages" class="message" [class.teacher]="msg.role === 'teacher'">
          <span class="author">{{ msg.author }}:</span>
          <span class="content">{{ msg.content }}</span>
        </div>
        <div *ngIf="aiSummary" class="ai-insight">
          <strong>AI Insight:</strong> {{ aiSummary }}
        </div>
      </div>
      
      <div class="input-area">
        <input [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Discuss here..." />
        <button (click)="sendMessage()">Send</button>
        <button class="summarize" (click)="getSummary()">AI Summary</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container { display: flex; flex-direction: column; height: 100%; }
    .messages { flex: 1; overflow-y: auto; padding: 15px; background: #0f172a; }
    .message { margin-bottom: 10px; color: #e2e8f0; }
    .author { font-weight: bold; margin-right: 5px; color: #3b82f6; }
    .message.teacher .author { color: #f59e0b; }
    .ai-insight {
      background: rgba(59, 130, 246, 0.2);
      border-left: 4px solid #3b82f6;
      padding: 10px;
      margin-top: 20px;
      font-size: 0.9rem;
      color: #93c5fd;
    }
    .input-area { display: flex; gap: 8px; padding: 15px; background: #1e293b; border-top: 1px solid #334155; }
    input { flex: 1; background: #0f172a; border: 1px solid #334155; color: white; padding: 8px 12px; border-radius: 6px; }
    button { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
    button.summarize { background: #8b5cf6; }
  `]
})
export class ChatSessionComponent implements OnInit {
  messages = [
    { author: 'Suraj', role: 'student', content: 'What is the role of the orchestrator?' },
    { author: 'Teacher', role: 'teacher', content: 'It manages the 50/10 split and ad matching.' }
  ];
  newMessage = '';
  aiSummary = '';

  constructor(private orchestrator: OrchestratorService) {}

  ngOnInit() {}

  sendMessage() {
    if (!this.newMessage.trim()) return;
    this.messages.push({ author: 'You', role: 'student', content: this.newMessage });
    this.newMessage = '';
    
    // Simulate AI moderation delay
    setTimeout(() => {
      console.log('Message moderated by AI');
    }, 500);
  }

  getSummary() {
    this.aiSummary = 'Calculating summary...';
    // Logic to call orchestrator.getSummary() which would hit Claude
    setTimeout(() => {
      this.aiSummary = 'The discussion focuses on the 50/10 orchestration engine and multi-criteria ad matching logic. Students are curious about implementation details.';
    }, 1500);
  }
}
