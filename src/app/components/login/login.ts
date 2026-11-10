import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UiDialogService } from '../../services/ui-dialog';
import { AuthService } from '../../services/auth';
import { getHttpErrormessage } from '../../lib/http-util';
import { PasswordForgot } from './password-forgot';
import { ButtonCustom } from '../common/button-custom';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, ButtonCustom],
    templateUrl: './login.html'
})
export class Login {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private authService = inject(AuthService); // Inject the service
    private readonly dialogService = inject(UiDialogService);

    // Manage UI error messages with a simple signal
    errorMessage = signal<string | string[] |null>(null);
    socialLoginLoading = signal(false);
    canResetPassword = signal(false);

    // Strongly-typed reactive form group definition
    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    onSubmit() {
        if (this.loginForm.valid) {
            this.errorMessage.set(null); // Clear previous errors
            this.canResetPassword.set(false);
            this.socialLoginLoading.set(true);
            this.authService.login(this.loginForm.value).subscribe({
                next: (response) => {
                    // Success callback
                    console.log('Login successful!', response);
                    this.router.navigate(['/dashboard']);
                },
                error: (err: any) => {
                    // Error callback (handles 401, 500, network issues, etc.)
                    console.error('Login failed', err);

                    let errorMsg = getHttpErrormessage(err, 'Invalid email or password.');
                    this.errorMessage.set(errorMsg);
                    this.canResetPassword.set(err?.status === 401);
                    this.socialLoginLoading.set(false);
                }
            });
        }
    }

    onResetPassword(): void {
        this.dialogService.open(PasswordForgot, undefined, { width: '480px' });
    }

    onGoogleLogin(): void {
        this.errorMessage.set(null);
        this.canResetPassword.set(false);
        this.socialLoginLoading.set(true);
        this.authService.startGoogleLogin().subscribe({
            next: (response: any) => {
                if (response && response.data.url) {
                    window.location.assign(response.data.url);
                }
            },
            error: (err: any) => {
                console.error('Google login failed', err);
                let errorMsg = getHttpErrormessage(err, 'Failed to initiate Google login.');
                this.errorMessage.set(errorMsg);
                this.socialLoginLoading.set(false)
            }
        });
    }

    onCreateAccount(): void {
        this.router.navigate(['/register']);
    }
}
