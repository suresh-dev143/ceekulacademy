import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PasswordValidation } from '../../models/registration.models';

@Component({
  selector: 'app-password-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './password-input.html',
  styleUrl: './password-input.scss'
})
export class PasswordInput {
  value = input<string>('');
  confirmValue = input<string>('');
  validation = input<PasswordValidation | null>(null);
  disabled = input<boolean>(false);

  valueChange = output<string>();
  confirmValueChange = output<string>();

  protected readonly showPassword = signal(false);
  protected readonly showConfirmPassword = signal(false);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }

  onConfirmPasswordInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.confirmValueChange.emit(target.value);
  }
}
