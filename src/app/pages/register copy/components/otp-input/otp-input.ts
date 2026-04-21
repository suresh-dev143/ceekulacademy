import {
  Component,
  input,
  output,
  signal,
  ViewChildren,
  QueryList,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-otp-input',
  imports: [CommonModule, FormsModule],
  templateUrl: './otp-input.html',
  styleUrl: './otp-input.scss'
})
export class OtpInput {
  length = input<number>(6);
  disabled = input<boolean>(false);

  otpComplete = output<string>();

  @ViewChildren('otpInput') inputs!: QueryList<ElementRef<HTMLInputElement>>;

  protected readonly digits = signal<string[]>([]);

  constructor() {
    effect(() => {
      const len = this.length();
      this.digits.set(Array(len).fill(''));
    });
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/\D/g, '');

    if (value.length >= 1) {
      const newDigits = [...this.digits()];
      newDigits[index] = value.charAt(0);
      this.digits.set(newDigits);

      // Auto-focus next input
      if (index < this.length() - 1) {
        setTimeout(() => this.focusInput(index + 1));
      }

      // Check if complete
      this.checkComplete();
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      const currentDigits = this.digits();
      if (!currentDigits[index] && index > 0) {
        // Move to previous input
        this.focusInput(index - 1);
      } else {
        // Clear current digit
        const newDigits = [...currentDigits];
        newDigits[index] = '';
        this.digits.set(newDigits);
      }
    } else if (event.key === 'ArrowLeft' && index > 0) {
      this.focusInput(index - 1);
    } else if (event.key === 'ArrowRight' && index < this.length() - 1) {
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text').replace(/\D/g, '') || '';
    const chars = pasted.slice(0, this.length()).split('');

    const newDigits = Array(this.length()).fill('');
    chars.forEach((char, i) => {
      newDigits[i] = char;
    });

    this.digits.set(newDigits);
    this.focusInput(Math.min(chars.length, this.length() - 1));
    this.checkComplete();
  }

  private focusInput(index: number): void {
    const inputArray = this.inputs?.toArray();
    if (inputArray && inputArray[index]) {
      inputArray[index].nativeElement.focus();
      inputArray[index].nativeElement.select();
    }
  }

  private checkComplete(): void {
    const otp = this.digits().join('');
    if (otp.length === this.length() && !otp.includes('')) {
      this.otpComplete.emit(otp);
    }
  }

  // Clear all digits
  clear(): void {
    this.digits.set(Array(this.length()).fill(''));
    this.focusInput(0);
  }
}
