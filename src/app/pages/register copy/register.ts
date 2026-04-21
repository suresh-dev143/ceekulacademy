import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DocumentUpload } from './components/document-upload/document-upload';
import { Navbar } from '../../components/landing-layout/landing-navbar/landing-navbar';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    Navbar,
    ReactiveFormsModule,
    DocumentUpload
  ],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register implements OnInit {
  registrationForm!: FormGroup;
  ceebrainId = signal<string>('');
  showSuccess = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.ceebrainId.set(this.generateCeebrainId());

    this.registrationForm = this.fb.group({
      mobileNo: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      dateOfBirth: ['', Validators.required],
      placeOfBirth: ['', Validators.required],
      identity: ['', Validators.required],
      gender: ['', Validators.required],
      bplCategory: ['', Validators.required],
      underprivilegedCategory: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[A-Z])(?=.*[0-9]).*$')
      ]],
      agreeToFramework: [false, Validators.requiredTrue]
    });
  }

  generateCeebrainId(): string {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  }

  onSubmit(): void {
    this.router.navigate(['personal/neurons']);
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.registrationForm.value;

    this.authService.ceebrainRegister({
      mobileNo: formValue.mobileNo,
      dateOfBirth: formValue.dateOfBirth || undefined,
      placeOfBirth: formValue.placeOfBirth || undefined,
      identity: formValue.identity || undefined,
      gender: formValue.gender || undefined,
      bplCategory: formValue.bplCategory || undefined,
      underprivilegedCategory: formValue.underprivilegedCategory || undefined,
      password: formValue.password,
      ceebrainId: this.ceebrainId(),
      agreeToFramework: formValue.agreeToFramework,
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showSuccess.set(true);
        setTimeout(() => this.router.navigate(['/personal/create']), 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }
}
