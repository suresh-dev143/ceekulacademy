import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentProfile } from '../../../services/student-dashboard.service';

@Component({
    selector: 'app-student-profile-edit',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="profile-container animate-fade-in">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-user-circle"></i> My Student Profile</h2>
        <button class="btn-toggle-edit" (click)="toggleEdit()">
          <i class="fas" [class.fa-edit]="!isEditing" [class.fa-times]="isEditing"></i>
          {{ isEditing ? 'Cancel Edit' : 'Edit Profile' }}
        </button>
      </div>

      <div class="profile-card">
        <!-- View Mode -->
        @if (!isEditing) {
        <div class="view-mode">
          <div class="profile-hero">
            <div class="avatar-large">{{ profile.name[0] }}</div>
            <div class="hero-info">
              <h3 class="hero-name">{{ profile.name }}</h3>
              <p class="hero-meta">{{ profile.grade }} · {{ profile.city }}</p>
              <div class="contact-row">
                <span><i class="fas fa-envelope"></i> {{ profile.email }}</span>
                <span><i class="fas fa-phone"></i> {{ profile.phone }}</span>
              </div>
            </div>
          </div>

          <div class="bio-section">
            <label class="lbl">Bio / About Me</label>
            <p class="bio-text">{{ profile.bio || 'No bio added yet.' }}</p>
          </div>

          <div class="interests-section">
            <label class="lbl">Interests & Goals</label>
            <div class="chip-cloud">
              @for (i of profile.interests; track $index) {
              <span class="chip">{{ i }}</span>
              }
            </div>
          </div>

          <div class="meta-footer">
            <span>Joined: {{ profile.joinedDate | date:'mediumDate' }}</span>
          </div>
        </div>
        }

        <!-- Edit Mode -->
        @if (isEditing) {
        <div class="edit-mode">
          <div class="form-grid">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="editData.name" placeholder="Enter your full name">
            </div>
            <div class="form-group">
              <label>Class / Grade</label>
              <input type="text" [(ngModel)]="editData.grade" placeholder="e.g. Class 12 (Science)">
            </div>
            <div class="form-group">
              <label>City</label>
              <input type="text" [(ngModel)]="editData.city" placeholder="e.g. Noida, UP">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input type="text" [(ngModel)]="editData.phone" placeholder="Contact number">
            </div>
            <div class="form-group full">
              <label>Bio</label>
              <textarea rows="3" [(ngModel)]="editData.bio" placeholder="Tell us about your learning goals..."></textarea>
            </div>
            <div class="form-group full">
              <label>Interests (comma separated)</label>
              <input type="text" [ngModel]="interestsStr" (ngModelChange)="updateInterests($event)" placeholder="Physics, Coding, Music...">
            </div>
          </div>

          <div class="action-footer">
            <button class="btn-cancel" (click)="toggleEdit()">Cancel</button>
            <button class="btn-save" (click)="save()">Save Changes</button>
          </div>
        </div>
        }
      </div>
    </div>
  `,
    styles: [`
    .profile-container { padding: 2.5rem 0; max-width: 800px; margin: 0 auto; }

    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 0.8rem; margin: 0; i { color: var(--accent-primary); } }
    
    .btn-toggle-edit {
      background: transparent; border: 1px solid var(--accent-primary); color: var(--accent-primary); padding: 0.6rem 1.2rem;
      font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; gap: 0.5rem;
      &:hover { background: var(--accent-primary); color: #000; }
    }

    .profile-card { background: #050505; border: 1px solid var(--row-border); padding: 2.5rem; position: relative; }

    /* View Mode Styles */
    .profile-hero { display: flex; align-items: center; gap: 2rem; margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--row-border); }
    .avatar-large { width: 100px; height: 100px; background: #000; border: 2px solid var(--accent-primary); color: var(--accent-primary); font-size: 3rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .hero-info { flex: 1; }
    .hero-name { font-size: 1.8rem; font-weight: 900; color: #fff; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 1px; }
    .hero-meta { font-size: 0.9rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 1rem; }
    .contact-row { display: flex; gap: 1.5rem; font-size: 0.85rem; color: #fff; font-weight: 600; i { color: var(--accent-primary); margin-right: 0.4rem; } }

    .lbl { display: block; font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.8rem; }
    .bio-section { margin-bottom: 2rem; }
    .bio-text { color: rgba(255,255,255,0.8); line-height: 1.6; font-size: 0.95rem; }
    
    .interests-section { margin-bottom: 2rem; }
    .chip-cloud { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .chip { font-size: 0.7rem; font-weight: 900; color: #000; background: var(--accent-primary); padding: 0.3rem 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }

    .meta-footer { border-top: 1px solid var(--row-border); padding-top: 1.5rem; font-size: 0.75rem; color: rgba(255,255,255,0.3); font-weight: 600; text-align: right; }

    /* Edit Mode Styles */
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.5rem; &.full { grid-column: span 2; } }
    .form-group label { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .form-group input, .form-group textarea {
      background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.8rem; font-size: 0.9rem; font-family: inherit; outline: none; transition: 0.2s;
      &:focus { border-color: var(--accent-primary); }
    }

    .action-footer { display: flex; justify-content: flex-end; gap: 1rem; }
    .btn-cancel { background: transparent; border: 1px solid var(--row-border); color: #fff; padding: 0.8rem 1.5rem; font-weight: 900; text-transform: uppercase; cursor: pointer; &:hover { background: rgba(255,255,255,0.05); } }
    .btn-save { background: var(--accent-primary); border: 1px solid var(--accent-primary); color: #000; padding: 0.8rem 2rem; font-weight: 900; text-transform: uppercase; cursor: pointer; font-size: 0.9rem; letter-spacing: 1px; &:hover { background: #fff; border-color: #fff; } }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

    @media(max-width:600px) { .profile-hero { flex-direction: column; text-align: center; } .contact-row { justify-content: center; } .form-grid { grid-template-columns: 1fr; } .form-group.full { grid-column: span 1; } }
  `]
})
export class StudentProfileEditComponent {
    @Input() profile!: StudentProfile;
    @Output() saveProfile = new EventEmitter<StudentProfile>();

    isEditing = false;
    editData!: StudentProfile;
    interestsStr = '';

    toggleEdit() {
        if (!this.isEditing) {
            this.editData = { ...this.profile };
            this.interestsStr = this.editData.interests.join(', ');
        }
        this.isEditing = !this.isEditing;
    }

    updateInterests(val: string) {
        this.interestsStr = val;
        this.editData.interests = val.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }

    save() {
        this.saveProfile.emit(this.editData);
        this.isEditing = false;
    }
}
