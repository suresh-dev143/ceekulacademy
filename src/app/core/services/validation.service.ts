import { Injectable } from '@angular/core';
import { FormGroup, FormArray, AbstractControl } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  /**
   * Returns a human-readable error message based on the Angular validation error object.
   * @param errors The errors object from an AbstractControl.
   * @param label The display name of the field (e.g., 'Facility Name').
   * @returns A string error message or null if no errors.
   */
  getErrorMessage(errors: any, label: string): string | null {
    if (!errors) return null;

    if (errors['serverError']) {
      return errors['serverError'];
    }

    if (errors['required']) {
      return `${label} is required. Please provide a value.`;
    }

    if (errors['min']) {
      return `${label} must be at least ${errors['min'].min}.`;
    }

    if (errors['max']) {
      return `${label} cannot exceed ${errors['max'].max}.`;
    }

    if (errors['email']) {
      return `Please enter a valid email address for ${label}.`;
    }

    if (errors['minlength']) {
        return `${label} must be at least ${errors['minlength'].requiredLength} characters long.`;
    }

    if (errors['maxlength']) {
        return `${label} cannot be more than ${errors['maxlength'].requiredLength} characters long.`;
    }

    if (errors['pattern']) {
        return `The format of ${label} is invalid.`;
    }

    // Default fallback
    return `${label} is invalid.`;
  }

  /**
   * Maps backend validation errors to form controls.
   * Expects errors in format: [{ field: 'path.to.field', message: 'error message' }]
   */
  handleBackendErrors(form: FormGroup | FormArray, errors: any[]): void {
    if (!errors || !Array.isArray(errors)) return;

    errors.forEach(err => {
      const control = this.findControlByPath(form, err.field);
      if (control) {
        // Find a label for the field by looking at the path
        const label = this.getLabelFromPath(err.field);
        const simpleMessage = this.simplifyBackendMessage(err.message, label);
        
        control.setErrors({ serverError: simpleMessage });
        control.markAsTouched();
      }
    });
  }

  /**
   * Translates technical backend messages into human-friendly ones.
   */
  private simplifyBackendMessage(message: string, label: string): string {
    const msg = message.toLowerCase();

    if (msg.includes('expected number') || msg.includes('expected float') || msg.includes('expected integer')) {
      return `${label} must be a valid number.`;
    }

    if (msg.includes('expected string') || msg.includes('required') || msg === 'invalid input') {
      return `${label} is required.`;
    }

    if (msg.includes('invalid email')) {
      return `Please enter a valid email address for ${label}.`;
    }

    // Keep custom messages like "End time must be after start time"
    return message;
  }

  private getLabelFromPath(path: string): string {
    // Convert camelCase or dot.notation into Title Case labels
    // e.g., 'availabilitySchedule.0.endTime' -> 'End Time'
    const parts = path.split('.');
    const lastPart = parts[parts.length - 1];
    
    // Convert camelCase to Space Case
    const result = lastPart.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1);
  }

  private findControlByPath(form: FormGroup | FormArray, path: string): AbstractControl | null {
    try {
      return form.get(path);
    } catch (e) {
      return null;
    }
  }
}
