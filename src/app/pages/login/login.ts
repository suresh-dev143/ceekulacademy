import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, LoginMethod } from '../../services/auth.service';

type Method = 'email' | 'phone' | 'ceebrain';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    loginMethod = signal<Method>('email');
    isSubmitting = signal(false);
    errorMessage = signal<string | null>(null);

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.loginForm = this.fb.group({
            identifier: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    get identifier() { return this.loginForm.get('identifier'); }
    get password() { return this.loginForm.get('password'); }

    setMethod(method: Method) {
        this.loginMethod.set(method);
        this.errorMessage.set(null);
        const ctrl = this.loginForm.get('identifier')!;
        ctrl.reset('');
        if (method === 'email') {
            ctrl.setValidators([Validators.required, Validators.email]);
        } else if (method === 'phone') {
            ctrl.setValidators([Validators.required, Validators.pattern('^[0-9]{10}$')]);
        } else {
            ctrl.setValidators([Validators.required, Validators.pattern('^[0-9]{12}$')]);
        }
        ctrl.updateValueAndValidity();
    }

    get identifierLabel(): string {
        return { email: 'Email Address', phone: 'Phone Number', ceebrain: 'Ceebrain ID' }[this.loginMethod()];
    }

    get identifierPlaceholder(): string {
        return { email: 'Enter your email', phone: 'Enter 10-digit phone number', ceebrain: 'Enter your 12-digit Ceebrain ID' }[this.loginMethod()];
    }

    get identifierType(): string {
        return this.loginMethod() === 'email' ? 'email' : 'text';
    }

    onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.isSubmitting.set(true);
        this.errorMessage.set(null);

        const { identifier, password } = this.loginForm.value;
        const method = this.loginMethod();

        const methodMap: Record<Method, LoginMethod> = {
            email: 'EMAIL_PASSWORD',
            phone: 'MOBILE_PASSWORD',
            ceebrain: 'CEEBRAIN_ID',
        };

        const payload = {
            password,
            loginMethod: methodMap[method],
            ...(method === 'email' && { email: identifier }),
            ...(method === 'phone' && { phone: identifier }),
            ...(method === 'ceebrain' && { ceebrainId: identifier }),
        };

        this.authService.login(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                const role = res.user.role?.toLowerCase() ?? '';
                this.router.navigate(['/personal', role]).catch(() => {
                    this.router.navigate(['/personal']);
                });
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.errorMessage.set(err?.error?.message ?? 'Login failed. Please try again.');
            }
        });
    }
}
