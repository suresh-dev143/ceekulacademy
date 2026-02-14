import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-login',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
    styleUrl: './login.scss'
})
export class LoginComponent {
    loginForm: FormGroup;
    isSubmitting = false;

    constructor(private fb: FormBuilder) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    onSubmit() {
        if (this.loginForm.valid) {
            this.isSubmitting = true;
            console.log('Login form submitted:', this.loginForm.value);
            // TODO: Implement actual authentication logic
            setTimeout(() => {
                this.isSubmitting = false;
                alert('Login functionality will be implemented with backend integration');
            }, 1000);
        } else {
            Object.keys(this.loginForm.controls).forEach(key => {
                this.loginForm.get(key)?.markAsTouched();
            });
        }
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
