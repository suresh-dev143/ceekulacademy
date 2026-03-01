import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-header',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="profile-header-card glass-card">
      <div class="avatar-container">
        <div class="avatar">{{ avatar }}</div>
        <button class="change-photo-btn"><i class="fas fa-camera"></i></button>
      </div>
      <div class="user-meta">
        <h1 class="user-name">{{ name }}</h1>
        <div class="role-badges">
          <span class="role-badge">{{ role }}</span>
        </div>
        <div class="completeness-box">
          <div class="completeness-header">
            <span>Profile Completeness</span>
            <span class="percentage">{{ completeness }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="completeness"></div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .profile-header-card {
      display: flex;
      align-items: center;
      gap: 2.5rem;
      padding: 2.5rem;
      margin-bottom: 2rem;
      animation: slideInDown 0.6s ease-out;
    }

    .avatar-container {
      position: relative;
      .avatar {
        width: 120px;
        height: 120px;
        background: color-mix(in srgb, #fff, transparent 95%);
        border: 2px solid rgba(102, 126, 234, 0.3);
        border-radius: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        box-shadow: 0 10px 30px color-mix(in srgb, #000, transparent 70%);
      }
      .change-photo-btn {
        position: absolute;
        bottom: -5px;
        right: -5px;
        width: 36px;
        height: 36px;
        border-radius: 12px;
        background: #667eea;
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        transition: transform 0.2s ease;
        &:hover { transform: scale(1.1); }
      }
    }

    .user-meta {
      flex-grow: 1;
      .user-name {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0 0 0.5rem;
        background: linear-gradient(135deg, #fff 0%, #667eea 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .role-badges {
        margin-bottom: 1.5rem;
        .role-badge {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.3rem 0.8rem;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 700;
          border: 1px solid rgba(102, 126, 234, 0.3);
        }
      }
    }

    .completeness-box {
      max-width: 300px;
      .completeness-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.8rem;
        font-weight: 700;
        color: color-mix(in srgb, #fff, transparent 50%);
        margin-bottom: 0.5rem;
        .percentage { color: #10b981; }
      }
      .progress-bar {
        height: 8px;
        background: color-mix(in srgb, #fff, transparent 95%);
        border-radius: 100px;
        overflow: hidden;
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 100px;
          transition: width 1s ease-in-out;
        }
      }
    }

    @media (max-width: 768px) {
      .profile-header-card { flex-direction: column; text-align: center; }
      .completeness-box { margin-inline: auto; }
    }
  `]
})
export class ProfileHeaderComponent {
    @Input() name: string = '';
    @Input() avatar: string = '';
    @Input() role: string = '';
    @Input() completeness: number = 0;
}
