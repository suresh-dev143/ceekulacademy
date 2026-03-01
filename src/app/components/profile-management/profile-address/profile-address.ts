import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-profile-address',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="section-card glass-card">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-map-marker-alt"></i> Address Information</h2>
        <button *ngIf="!isEditing" class="edit-btn" (click)="toggleEdit()">Edit</button>
      </div>

      <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="modern-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Country</label>
            <input type="text" formControlName="country" [readonly]="!isEditing">
          </div>
          <div class="form-group">
            <label>State</label>
            <input type="text" formControlName="state" [readonly]="!isEditing">
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" formControlName="city" [readonly]="!isEditing">
          </div>
          <div class="form-group">
            <label>Pincode / ZIP code</label>
            <input type="text" formControlName="pincode" [readonly]="!isEditing">
          </div>
          <div class="form-group full">
            <label>Full Address</label>
            <input type="text" formControlName="street" [readonly]="!isEditing">
          </div>
        </div>

        <div class="form-actions" *ngIf="isEditing">
          <button type="button" class="btn-cancel" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn-save" [disabled]="addressForm.invalid">Save Changes</button>
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
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; }
      .form-group { display: flex; flex-direction: column; gap: 0.5rem;
        &.full { grid-column: 1 / -1; }
        label { font-size: 0.85rem; font-weight: 600; color: color-mix(in srgb, #fff, transparent 50%); }
        input { background: color-mix(in srgb, #fff, transparent 95%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); border-radius: 12px; padding: 0.8rem 1rem; color: white; font-family: inherit;
          &:focus { outline: none; border-color: #667eea; background: color-mix(in srgb, #fff, transparent 92%); }
          &[readonly] { background: transparent; border-color: transparent; padding-left: 0; cursor: default; }
        }
      }
    }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; 
      button { padding: 0.7rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; }
      .btn-cancel { background: transparent; border: 1px solid color-mix(in srgb, #fff, transparent 90%); color: white; }
      .btn-save { background: #667eea; border: none; color: white; box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3); }
    }
  `]
})
export class ProfileAddressComponent implements OnInit {
    @Input() addressData: any;
    @Output() save = new EventEmitter<any>();

    isEditing = false;
    addressForm!: FormGroup;

    constructor(private fb: FormBuilder) { }

    ngOnInit() {
        this.addressForm = this.fb.group({
            country: [this.addressData.country, Validators.required],
            state: [this.addressData.state, Validators.required],
            city: [this.addressData.city, Validators.required],
            pincode: [this.addressData.pincode, Validators.required],
            street: [this.addressData.street, Validators.required]
        });
    }

    toggleEdit() {
        this.isEditing = true;
    }

    cancel() {
        this.isEditing = false;
        this.addressForm.reset(this.addressData);
    }

    onSubmit() {
        if (this.addressForm.valid) {
            this.save.emit(this.addressForm.value);
            this.isEditing = false;
        }
    }
}
