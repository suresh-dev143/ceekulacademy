import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrchestratorService } from '../../services/orchestrator.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-split-screen-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="split-container">
      <!-- Top Pane: Content Rendering -->
      <div class="content-pane" [class.ad-mode]="isAdMode">
        <div class="header">
          <span class="status-badge" [class.live]="!isAdMode" [class.ad]="isAdMode">
            {{ isAdMode ? 'ADVERTISEMENT' : 'LIVE CONTENT' }}
          </span>
          <span class="timer">Next transition in: {{ remainingTime }}s</span>
        </div>
        
        <div class="renderer-container">
          <ng-container *ngIf="!isAdMode">
            <h1>Adaptive Learning Segment</h1>
            <p>Evolving content based on cognition signals...</p>
            <div class="placeholder-video">Main Learning Content</div>
          </ng-container>
          
          <ng-container *ngIf="isAdMode">
            <div class="ad-block">
              <h2>{{ currentAd?.title }}</h2>
              <div class="ad-player">Playing Advertisement (10s block)</div>
              <p>Contextually matched based on your profile.</p>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Bottom Pane: Interactive Chat -->
      <div class="chat-pane">
        <div class="chat-header">
          <h3>Discussion & AI Moderation</h3>
        </div>
        <div class="chat-messages">
          <div class="message system">AI: Moderating discussion...</div>
          <div class="message">Student: How does orchestration work?</div>
          <div class="message">Teacher: It divides the hour into 50m content and 10m ads.</div>
        </div>
        <div class="chat-input">
          <input type="text" placeholder="Type a message..." />
          <button>Send</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .split-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0f172a;
      color: white;
    }
    .content-pane {
      flex: 1.5;
      padding: 20px;
      border-bottom: 2px solid #334155;
      position: relative;
    }
    .content-pane.ad-mode {
      background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    }
    .chat-pane {
      flex: 1;
      padding: 10px;
      background: #1e293b;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: bold;
    }
    .status-badge.live { background: #10b981; }
    .status-badge.ad { background: #f59e0b; }
    .placeholder-video, .ad-player {
      width: 100%;
      height: 200px;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    .chat-messages { flex: 1; overflow-y: auto; padding: 10px; }
    .message { margin-bottom: 8px; font-size: 0.9rem; }
    .message.system { color: #94a3b8; font-style: italic; }
    .chat-input { display: flex; gap: 8px; padding: 10px; }
    input { flex: 1; background: #334155; border: none; padding: 8px; border-radius: 4px; color: white; }
    button { background: #3b82f6; border: none; padding: 8px 16px; border-radius: 4px; color: white; cursor: pointer; }
  `]
})
export class SplitScreenLayoutComponent implements OnInit, OnDestroy {
  isAdMode = false;
  remainingTime = 0;
  currentAd: any = null;
  private sub: Subscription | null = null;

  constructor(private orchestrator: OrchestratorService) {}

  ngOnInit() {
    this.refreshSchedule();
    this.sub = interval(1000).subscribe(() => {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.refreshSchedule();
      }
    });
  }

  refreshSchedule() {
    this.orchestrator.getCurrentSchedule({ location: 'IN', language: 'en' }).subscribe(data => {
      this.isAdMode = data.type === 'ADVERTISEMENT';
      this.remainingTime = data.remainingSeconds;
      this.currentAd = data.ad;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
