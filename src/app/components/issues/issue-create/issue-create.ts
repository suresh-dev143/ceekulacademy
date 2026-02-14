import { Component, inject, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { IssueService, IssueCategory } from '../../../services/issue.service';

@Component({
  selector: 'app-issue-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="issue-create-card glass-card">
      <h2 class="form-title">Report New Issue</h2>

      <form [formGroup]="issueForm" (ngSubmit)="onSubmit()">
        <!-- Section 1: Category -->
        <div class="form-section animate-fade">
          <h3>1. What is the issue about?</h3>
          <div class="form-group">
            <label>Category *</label>
            <select formControlName="category" class="form-control">
              <option value="" disabled>Select a category</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group" *ngIf="issueForm.get('category')?.value">
            <label>Sub-category (Optional)</label>
            <input type="text" formControlName="subCategory" placeholder="e.g. Water Supply, Road Block..." class="form-control">
          </div>
        </div>

        <!-- Section 2: Description -->
        <div class="form-section animate-fade">
          <h3>2. Describe the problem</h3>
          <div class="form-group">
            <label>Description *</label>
            <textarea formControlName="description" rows="5" placeholder="Clear explanation of the problem and its impact..." class="form-control"></textarea>
          </div>
          <div class="form-group">
            <label>Urgency</label>
            <div class="urgency-selector">
              <button type="button" *ngFor="let u of urgencies" 
                      [class.active]="issueForm.get('urgency')?.value === u"
                      (click)="issueForm.get('urgency')?.setValue(u)">
                {{ u }}
              </button>
            </div>
          </div>
        </div>

        <!-- Section 3: Media -->
        <div class="form-section animate-fade">
          <h3>3. Upload Photos/Videos</h3>
          <div class="upload-zone" (click)="fileInput.click()">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Click to upload images or videos</p>
            <input #fileInput type="file" (change)="onFileSelected($event)" multiple hidden accept="image/*,video/*">
          </div>
          <div class="media-previews" *ngIf="previews().length > 0">
            <div *ngFor="let p of previews(); let i = index" class="preview-item">
              <img [src]="p" *ngIf="!isVideo(p)">
              <div class="video-placeholder" *ngIf="isVideo(p)">
                <i class="fas fa-video"></i>
              </div>
              <button type="button" class="remove-btn" (click)="removePreview(i)">&times;</button>
            </div>
          </div>
        </div>

        <!-- Section 4: Contact -->
        <div class="form-section animate-fade">
          <h3>4. Verification Contact</h3>
          <p class="section-hint">Your identity is required for verification but hidden from public view.</p>
          <div class="form-row">
            <div class="form-group">
              <label>Full Name *</label>
              <input type="text" formControlName="contactName" class="form-control">
            </div>
            <div class="form-group">
              <label>Phone Number *</label>
              <input type="tel" formControlName="contactPhone" class="form-control">
            </div>
          </div>
          <div class="form-group">
            <label>Email Address *</label>
            <input type="email" formControlName="contactEmail" class="form-control">
          </div>
        </div>

        <!-- Section 5: Location -->
        <div class="form-section animate-fade">
          <h3>5. Where is this happening?</h3>
          <div class="form-row">
            <div class="form-group">
              <label>Area / Locality *</label>
              <input type="text" formControlName="area" class="form-control">
            </div>
            <div class="form-group">
              <label>City *</label>
              <input type="text" formControlName="city" class="form-control">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>District *</label>
              <input type="text" formControlName="district" class="form-control">
            </div>
            <div class="form-group">
              <label>State *</label>
              <input type="text" formControlName="state" class="form-control">
            </div>
          </div>
        </div>

        <!-- Section 6: Consent & Submit -->
        <div class="form-section animate-fade">
          <h3>6. Confirm & Submit</h3>
          <div class="consent-check">
            <input type="checkbox" id="consent" formControlName="consent">
            <label for="consent">I declare that the information provided is accurate and I consent to being contacted for verification.</label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-submit" [disabled]="!issueForm.valid">Submit Issue</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .issue-create-card { padding: 2.5rem; border-radius: 28px; max-width: 800px; margin: 0 auto; }
    .form-title { text-align: center; color: #fff; margin-bottom: 2rem; font-family: 'Montserrat', sans-serif; }

    .form-section { margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
    .form-section:last-child { border-bottom: none; margin-bottom: 1rem; }

    h3 { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; color: #667eea; margin-bottom: 1.5rem; display: flex; align-items: center; }
    .section-hint { color: rgba(255, 255, 255, 0.5); font-size: 0.9rem; margin-bottom: 1.5rem; }

    .form-group { margin-bottom: 1.5rem; label { display: block; font-size: 0.85rem; font-weight: 700; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.6rem; text-transform: uppercase; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    
    .form-control { width: 100%; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: #fff; font-size: 1rem;
      &:focus { outline: none; border-color: #667eea; background: rgba(255, 255, 255, 0.05); }
    }

    .urgency-selector { display: flex; gap: 0.8rem;
      button { flex: 1; padding: 0.8rem; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); background: transparent; color: #fff; font-weight: 700; cursor: pointer; transition: 0.2s;
        &.active { background: #667eea; border-color: #667eea; }
      }
    }

    .upload-zone { border: 2px dashed rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 3rem; text-align: center; cursor: pointer; transition: 0.3s;
      i { font-size: 3rem; color: #667eea; margin-bottom: 1rem; }
      p { color: rgba(255, 255, 255, 0.5); font-weight: 500; }
      &:hover { background: rgba(255, 255, 255, 0.02); border-color: #667eea; }
    }

    .media-previews { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 1rem; margin-top: 2rem;
      .preview-item { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 1;
        img { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder { width: 100%; height: 100%; background: #222; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: rgba(255,255,255,0.3); }
        .remove-btn { position: absolute; top: 5px; right: 5px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.5); border: none; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
      }
    }

    .consent-check { display: flex; gap: 1rem; align-items: flex-start; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem; line-height: 1.4;
      input { margin-top: 0.3rem; }
    }

    .form-actions { margin-top: 3rem; text-align: right; }
    .btn-submit { padding: 1rem 3rem; border-radius: 12px; font-weight: 800; cursor: pointer; border: none; transition: 0.3s; background: #667eea; color: #fff; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3); font-size: 1.1rem;
      &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }
      &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
    }

    .animate-fade { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `]
})
export class IssueCreateComponent {
  @Output() submitted = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private issueService = inject(IssueService);

  previews = signal<string[]>([]);
  categories: IssueCategory[] = ['Health', 'Study / Education', 'Local Issue', 'Infrastructure', 'Safety', 'Other'];
  urgencies = ['Low', 'Medium', 'High', 'Critical'];

  issueForm = this.fb.group({
    category: ['', Validators.required],
    subCategory: [''],
    description: ['', [Validators.required, Validators.minLength(10)]],
    urgency: ['Medium'],
    contactName: ['', Validators.required],
    contactPhone: ['', Validators.required],
    contactEmail: ['', [Validators.required, Validators.email]],
    area: ['', Validators.required],
    city: ['', Validators.required],
    district: ['', Validators.required],
    state: ['', Validators.required],
    consent: [false, Validators.requiredTrue]
  });

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let file of files) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.previews.update(p => [...p, e.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePreview(index: number) {
    this.previews.update(p => p.filter((_, i) => i !== index));
  }

  isVideo(url: string) {
    return url.startsWith('data:video');
  }

  onSubmit() {
    if (this.issueForm.valid) {
      const formValue = this.issueForm.value;
      this.issueService.submitIssue({
        category: formValue.category as IssueCategory,
        subCategory: formValue.subCategory || undefined,
        description: formValue.description || '',
        urgency: formValue.urgency as any,
        mediaUrls: this.previews(),
        contact: {
          name: formValue.contactName || '',
          phone: formValue.contactPhone || '',
          email: formValue.contactEmail || '',
          userId: 'user-id-mock'
        },
        location: {
          area: formValue.area || '',
          city: formValue.city || '',
          district: formValue.district || '',
          state: formValue.state || ''
        }
      });
      this.submitted.emit();
    }
  }
}
