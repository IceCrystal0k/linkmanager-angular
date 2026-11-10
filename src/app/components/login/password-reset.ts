import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';

@Component({
    selector: 'app-password-reset',
    standalone: true,
    imports: [ReactiveFormsModule, MatButtonModule, RouterLink],
    templateUrl: './password-reset.html'
})
export class PasswordReset {
    private readonly fb = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly accountService = inject(AccountService);

    readonly isSubmitting = signal(false);
    readonly isReset = signal(false);
    readonly errorMessage = signal<string | string[] | null>(null);

    readonly resetForm = this.fb.nonNullable.group({
        password: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
            ]
        ]
    });

    private getToken(): string | null {
        return this.route.snapshot.paramMap.get('token')
            ?? this.route.snapshot.queryParamMap.get('token');
    }

    isErrorList(message: string | string[]): message is string[] {
        return Array.isArray(message);
    }

    async onSubmit(): Promise<void> {
        if (this.resetForm.invalid || this.isSubmitting()) {
            this.resetForm.markAllAsTouched();
            return;
        }

        const token = this.getToken();
        if (!token) {
            this.errorMessage.set('The password reset link is missing its token.');
            return;
        }

        this.errorMessage.set(null);
        this.isSubmitting.set(true);
        try {
            await firstValueFrom(this.accountService.sendAccountRequest({
                action: 'reset-password',
                token,
                password: this.resetForm.controls.password.value
            }));
            this.isReset.set(true);
        } catch (error: unknown) {
            console.error('Failed to reset password', error);
            this.errorMessage.set(getHttpErrormessage(error, 'Unable to reset your password. Please try again.'));
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
