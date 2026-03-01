import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-profile-personal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="section-card glass-card">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-user-circle"></i> Personal Information</h2>
        <button *ngIf="!isEditing" class="edit-btn" (click)="toggleEdit()">Edit</button>
      </div>

      <form [formGroup]="personalForm" (ngSubmit)="onSubmit()" class="modern-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" formControlName="name" [readonly]="!isEditing">
          </div>
          <div class="form-group">
            <label>Email Address (Read-only)</label>
            <input type="email" formControlName="email" readonly class="readonly-input">
          </div>
          <div class="form-group">
            <label>Mobile Number</label>
            <input type="tel" formControlName="mobile" [readonly]="!isEditing" placeholder="+91 XXX-XXX-XXXX">
          </div>
          <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" formControlName="dob" [readonly]="!isEditing">
          </div>
          <div class="form-group">
            <label>Gender</label>
            <select formControlName="gender" [disabled]="!isEditing">
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div class="form-actions" *ngIf="isEditing">
          <button type="button" class="btn-cancel" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn-save" [disabled]="personalForm.invalid">Save Changes</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .section-card {
      padding: 2rem;
      border-radius: 20px;
      margin-bottom: 2rem;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      .section-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.25rem;
        font-weight: 700;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        i { color: #667eea; }
      }
    }
    .edit-btn {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: 1px solid rgba(102, 126, 234, 0.3);
      padding: 0.4rem 1.2rem;
      border-radius: 100px;
      font-weight: 700;
      cursor: pointer;
      &:hover { background: rgba(102, 126, 234, 0.2); }
    }
    .modern-form {
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        label { font-size: 0.85rem; font-weight: 600; color: color-mix(in srgb, #fff, transparent 50%); }
        input, select {
          background: color-mix(in srgb, #fff, transparent 95%);
          border: 1px solid color-mix(in srgb, #fff, transparent 90%);
          border-radius: 12px;
          padding: 0.8rem 1rem;
          color: white;
          font-family: inherit;
          &:focus { outline: none; border-color: #667eea; background: color-mix(in srgb, #fff, transparent 92%); }
          &[readonly] { background: transparent; border-color: transparent; padding-left: 0; cursor: default; }
          &.readonly-input { color: color-mix(in srgb, #fff, transparent 70%); }
        }
        select:disabled { background: transparent; border-color: transparent; appearance: none; padding-left: 0; color: white; opacity: 1; }
      }
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      button { padding: 0.7rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
      .btn-cancel { background: transparent; border: 1px solid color-mix(in srgb, #fff, transparent 90%); color: white; }
      .btn-save { background: #667eea; border: none; color: white; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); }
    }
  `]
})
export class ProfilePersonalComponent implements OnInit {
    @Input() userData: any;
    @Output() save = new EventEmitter<any>();

    isEditing = false;
    personalForm!: FormGroup;

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.personalForm = this.fb.group({
            name: [this.userData.name, Validators.required],
            email: [this.userData.email],
            mobile: [this.userData.mobile, Validators.required],
            dob: [this.userData.dob],
            gender: [this.userData.gender]
        });
    }

    toggleEdit() {
        this.isEditing = true;
    }

    cancel() {
        this.isEditing = false;
        this.personalForm.reset(this.userData);
    }

    onSubmit() {
        if (this.personalForm.valid) {
            this.save.emit(this.personalForm.value);
            this.isEditing = false;
        }
    }
}
