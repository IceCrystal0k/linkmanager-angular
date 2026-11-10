import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
    MatDialogActions,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';

@Component({
    selector: 'app-password-forgot',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions
    ],
    templateUrl: './password-forgot.html'
})
export class PasswordForgot {
    private readonly fb = inject(FormBuilder);
    private readonly accountService = inject(AccountService);
    private readonly dialogRef = inject(MatDialogRef<PasswordForgot>);

    readonly isSubmitting = signal(false);
    readonly emailSent = signal(false);
    readonly errorMessage = signal<string | string[] | null>(null);

    readonly resetForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]]
    });

    async onSendEmail(): Promise<void> {
        if (this.resetForm.invalid || this.isSubmitting()) {
            this.resetForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);
        this.isSubmitting.set(true);
        try {
            await firstValueFrom(this.accountService.sendPasswordResetEmail({
                action: 'reset-password',
                email: this.resetForm.controls.email.value
            }));
            this.emailSent.set(true);
        } catch (error: unknown) {
            console.error('Failed to send password reset email', error);
            this.errorMessage.set(getHttpErrormessage(error, 'Unable to send the reset email. Please try again.'));
        } finally {
            this.isSubmitting.set(false);
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
