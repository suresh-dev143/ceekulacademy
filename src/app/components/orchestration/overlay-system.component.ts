import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface AIOverlay {
  timestamp: number;
  type: 'summary' | 'annotation' | 'explanation';
  content: string;
}

@Component({
  selector: 'app-overlay-system',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overlay-container">
      <div *ngFor="let item of activeOverlays" 
           class="overlay-card" 
           [class]="item.type"
           [style.top.px]="getRandomY()">
        <div class="overlay-header">
          <span class="type-icon">✨</span>
          <span class="type-label">{{ item.type | uppercase }}</span>
        </div>
        <div class="overlay-content">{{ item.content }}</div>
      </div>
    </div>
  `,
  styles: [`
    .overlay-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
    }
    .overlay-card {
      position: absolute;
      left: 20px;
      width: 250px;
      padding: 12px;
      border-radius: 12px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(8px);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-left: 4px solid #3b82f6;
      animation: slideIn 0.5s ease-out;
      pointer-events: auto;
    }
    .overlay-card.summary { border-color: #10b981; }
    .overlay-card.annotation { border-color: #f59e0b; }
    .overlay-card.explanation { border-color: #8b5cf6; }
    
    .overlay-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 0.7rem;
      font-weight: bold;
      color: #94a3b8;
    }
    .overlay-content {
      font-size: 0.85rem;
      color: #f1f5f9;
      line-height: 1.4;
    }

    @keyframes slideIn {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class OverlaySystemComponent implements OnInit {
  @Input() currentTime = 0;
  
  // Mocked AI overlays for a recorded session
  private overlays: AIOverlay[] = [
    { timestamp: 5, type: 'summary', content: 'In this section, we discuss the core principles of adaptive scheduling.' },
    { timestamp: 15, type: 'explanation', content: 'Why 50 minutes? Research shows cognitive load peaks at 45-50 min intervals.' },
    { timestamp: 30, type: 'annotation', content: 'Check out the docs for Multi-Criteria Matching algorithms.' }
  ];

  activeOverlays: AIOverlay[] = [];

  ngOnInit() {
    // Logic to update active overlays based on currentTime
  }

  ngOnChanges() {
    // Show overlays that are within 5 seconds of the current time
    this.activeOverlays = this.overlays.filter(o => 
      this.currentTime >= o.timestamp && this.currentTime < o.timestamp + 5
    );
  }

  getRandomY() {
    return Math.floor(Math.random() * 300) + 50;
  }
}
