import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-sidebar-right',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="sidebar-right-content">
      <div class="tips-card glass-card">
        <h3><i class="fas fa-lightbulb"></i> Profile Tips</h3>
        <ul class="tips-list">
          <li>Complete your bio to improve your profile's visibility.</li>
          <li>Add specializations to showcase your expertise.</li>
          <li>Set availability to receive meeting requests.</li>
          <li>Link your LinkedIn to build professional trust.</li>
        </ul>
      </div>

      <div class="status-card glass-card">
        <h3><i class="fas fa-shield-alt"></i> Trust Score</h3>
        <div class="score-display">
          <span class="score-value">85</span>
          <span class="score-max">/ 100</span>
        </div>
        <p class="score-desc">Your profile is highly trusted. Identity and roles are verified.</p>
      </div>
    </div>
  `,
    styles: [`
    .sidebar-right-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      animation: fadeInRight 0.6s ease-out;
    }
    .glass-card {
      padding: 1.5rem;
      border-radius: 20px;
      h3 { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.6rem; 
        i { color: #f59e0b; }
      }
    }
    .tips-list {
      list-style: none;
      padding: 0;
      li { font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); padding-left: 1rem; position: relative; margin-bottom: 0.8rem; line-height: 1.4;
        &:before { content: "•"; position: absolute; left: 0; color: #667eea; }
      }
    }
    .score-display {
      margin-bottom: 0.5rem;
      .score-value { font-size: 2rem; font-weight: 800; color: #10b981; }
      .score-max { font-size: 1.1rem; color: rgba(255, 255, 255, 0.3); font-weight: 700; }
    }
    .score-desc { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); margin: 0; font-weight: 500; }

    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ProfileSidebarRightComponent { }
