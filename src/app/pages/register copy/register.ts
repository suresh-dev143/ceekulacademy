import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DocumentUpload } from './components/document-upload/document-upload';
import { Router,RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pw && confirm && pw !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    RouterLink,
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
      confirmPassword: ['', Validators.required],
      agreeToFramework: [false, Validators.requiredTrue]
    }, { validators: passwordsMatch });
  }

  onSubmit(): void {
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
      agreeToFramework: formValue.agreeToFramework,
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.ceebrainId.set(res.user.ceebrainId ?? '');
        this.showSuccess.set(true);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }
}
