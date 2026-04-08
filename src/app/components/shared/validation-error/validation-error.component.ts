import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-form-validation-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (shouldShowError()) {
    <div class="error-message">
       <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
    </div>
    }
  `,
  styles: [`
    .error-message {
      color: #ff4d4d;
      font-size: 0.75rem;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
      animation: fadeIn 0.2s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-5px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AppValidationErrorComponent {
  @Input({ required: true }) control!: AbstractControl | null;
  @Input({ required: true }) label!: string;

  private validationService = inject(ValidationService);

  get errorMessage(): string | null {
    if (this.control && this.control.errors) {
      return this.validationService.getErrorMessage(this.control.errors, this.label);
    }
    return null;
  }

  shouldShowError(): boolean {
    if (!this.control) return false;
    
    // Show if control is invalid AND (touched OR has a server error)
    return this.control.invalid && (this.control.touched || this.control.dirty || !!this.control.errors?.['serverError']);
  }
}
