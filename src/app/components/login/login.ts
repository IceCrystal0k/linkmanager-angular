import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, MatButtonModule, MatIconModule],
    templateUrl: './login.html'
})
export class Login {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService); // Inject the service

    // Manage UI error messages with a simple signal
    errorMessage = signal<string | null>(null);

    // Strongly-typed reactive form group definition
    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    onSubmit() {
        if (this.loginForm.valid) {
            this.errorMessage.set(null); // Clear previous errors
            this.authService.login(this.loginForm.value).subscribe({
                next: (response) => {
                    // Success callback
                    console.log('Login successful!', response);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    // Error callback (handles 401, 500, network issues, etc.)
                    console.error('Login failed', err);
                    this.errorMessage.set(err.error?.errors?.join('<br/>') || 'Invalid email or password.');
                }
            });
        }
    }
}
