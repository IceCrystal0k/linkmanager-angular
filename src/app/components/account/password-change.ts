import { Component, inject, signal } from '@angular/core';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';

const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const repeatPassword = control.get('repeat_password')?.value;

    if (!password || !repeatPassword) {
        return null;
    }

    return password === repeatPassword ? null : { passwordMismatch: true };
};

@Component({
    selector: 'app-password-change',
    standalone: true,
    imports: [ReactiveFormsModule, MatButtonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose],
    templateUrl: './password-change.html'
})
export class PasswordChange {
    private readonly fb = inject(FormBuilder);
    private readonly accountService = inject(AccountService);
    private readonly dialogRef = inject(MatDialogRef<PasswordChange>);

    readonly saveErrorMessage = signal<string | string[] | null>(null);
    readonly isSubmitting = signal(false);

    readonly passwordForm = this.fb.nonNullable.group({
        current_password: ['', [Validators.required, Validators.minLength(8)]],
        password: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
            ]
        ],
        repeat_password: ['', Validators.required],
        action: ['update-password']
    }, { validators: passwordsMatchValidator });

    async onUpdatePassword(): Promise<void> {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.saveErrorMessage.set(null);
        this.isSubmitting.set(true);
        try {
            await firstValueFrom(this.accountService.updatePassword(this.passwordForm.getRawValue()));
            this.dialogRef.close(true);
        } catch (error: unknown) {
            console.error('Failed to perform update password action:', error);
            this.saveErrorMessage.set(getHttpErrormessage(error, 'Unable to perform action. Please try again.'));
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
