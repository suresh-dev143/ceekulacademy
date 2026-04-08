import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink, LayoutComponent],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    isSubmitting = signal(false);

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.loginForm = this.fb.group({
            email:      ['', [Validators.required, Validators.email]],
            password:   ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    get email()    { return this.loginForm.get('email'); }
    get password() { return this.loginForm.get('password'); }

    onSubmit() {
        if (this.loginForm.invalid) {
            Object.keys(this.loginForm.controls).forEach(key =>
                this.loginForm.get(key)?.markAsTouched()
            );
            return;
        }

        this.isSubmitting.set(true);

        const { email, password } = this.loginForm.value;

        this.authService.login({ email, password }).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                const role = res.user.role?.toLowerCase() ?? '';
                this.router.navigate(['/dashboard', role]).catch(() => {
                    this.router.navigate(['/dashboard']);
                });
            },
            error: () => this.isSubmitting.set(false)
        });
    }
}
