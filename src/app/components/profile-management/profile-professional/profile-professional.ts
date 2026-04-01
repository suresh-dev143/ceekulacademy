import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-profile-professional',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="section-card glass-card">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-briefcase"></i> Professional Information</h2>
        <button *ngIf="!isEditing" class="edit-btn" (click)="toggleEdit()">Edit</button>
      </div>

      <form [formGroup]="professionalForm" (ngSubmit)="onSubmit()" class="modern-form">
        <div class="form-grid">
          <div class="form-group full">
            <label>Bio / Introduction</label>
            <textarea formControlName="bio" [readonly]="!isEditing" rows="4" placeholder="Tell us about yourself..."></textarea>
          </div>
          <div class="form-group">
            <label>Experience</label>
            <input type="text" formControlName="experience" [readonly]="!isEditing" placeholder="e.g., 5+ Years">
          </div>
          <div class="form-group">
            <label>Mode Preference</label>
            <select formControlName="modePreference" [disabled]="!isEditing">
              <option value="Online (Remote)">Remote</option>
              <option value="Offline (On-site)">On-site</option>
              <option value="Offline">Offline</option>
              <option value="Home Tuition">Home Tuition</option>
            </select>
          </div>
          <div class="form-group">
            <label>LinkedIn URL</label>
            <input type="url" formControlName="linkedin" [readonly]="!isEditing" placeholder="https://linkedin.com/in/username">
          </div>
          <div class="form-group">
            <label>Portfolio / Website</label>
            <input type="url" formControlName="portfolio" [readonly]="!isEditing" placeholder="https://yourwebsite.com">
          </div>
        </div>

        <div class="form-actions" *ngIf="isEditing">
          <button type="button" class="btn-cancel" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn-save" [disabled]="professionalForm.invalid">Save Changes</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .section-card { padding: 2rem; border-radius: 20px; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.8rem; i { color: #667eea; } }
    .edit-btn { background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.3); padding: 0.4rem 1.2rem; border-radius: 100px; font-weight: 700; cursor: pointer; }
    .modern-form {
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
      .form-group { display: flex; flex-direction: column; gap: 0.5rem;
        &.full { grid-column: 1 / -1; }
        label { font-size: 0.85rem; font-weight: 600; color: color-mix(in srgb, #fff, transparent 50%); }
        input, select, textarea {
          background: color-mix(in srgb, #fff, transparent 95%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); border-radius: 12px; padding: 0.8rem 1rem; color: white; font-family: inherit;
          &:focus { outline: none; border-color: #667eea; background: color-mix(in srgb, #fff, transparent 92%); }
          &[readonly] { background: transparent; border-color: transparent; padding-left: 0; cursor: default; }
        }
        select:disabled { background: transparent; border-color: transparent; appearance: none; padding-left: 0; color: white; opacity: 1; }
      }
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; 
      button { padding: 0.7rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
      .btn-cancel { background: transparent; border: 1px solid color-mix(in srgb, #fff, transparent 90%); color: white; }
      .btn-save { background: #667eea; border: none; color: white; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); }
    }
  `]
})
export class ProfileProfessionalComponent implements OnInit {
    @Input() professionalData: any;
    @Output() save = new EventEmitter<any>();

    isEditing = false;
    professionalForm!: FormGroup;

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.professionalForm = this.fb.group({
            bio: [this.professionalData.bio, Validators.required],
            experience: [this.professionalData.experience],
            modePreference: [this.professionalData.modePreference],
            linkedin: [this.professionalData.links?.linkedin],
            portfolio: [this.professionalData.links?.portfolio]
        });
    }

    toggleEdit() {
        this.isEditing = true;
    }

    cancel() {
        this.isEditing = false;
        this.professionalForm.reset({
            bio: this.professionalData.bio,
            experience: this.professionalData.experience,
            modePreference: this.professionalData.modePreference,
            linkedin: this.professionalData.links?.linkedin,
            portfolio: this.professionalData.links?.portfolio
        });
    }

    onSubmit() {
        if (this.professionalForm.valid) {
            const formValue = this.professionalForm.value;
            this.save.emit({
                bio: formValue.bio,
                experience: formValue.experience,
                modePreference: formValue.modePreference,
                links: {
                    linkedin: formValue.linkedin,
                    portfolio: formValue.portfolio
                }
            });
            this.isEditing = false;
        }
    }
}
