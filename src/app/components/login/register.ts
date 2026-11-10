import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';
import { ButtonCustom } from '../common/button-custom';

const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const password = control.get('password')?.value;
    const repeatPassword = control.get('repeat_password')?.value;

    if (!password || !repeatPassword) {
        return null;
    }

    return password === repeatPassword ? null : { passwordMismatch: true };
};

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [ReactiveFormsModule, MatButtonModule, MatIconModule, RouterLink, ButtonCustom],
    templateUrl: './register.html'
})
export class Register {
    private readonly fb = inject(FormBuilder);
    private readonly accountService = inject(AccountService);

    readonly errorMessage = signal<string | string[] | null>(null);
    readonly isSubmitting = signal(false);
    readonly registrationComplete = signal(false);

    readonly registerForm = this.fb.nonNullable.group({
        email: ['', [Validators.required, Validators.email]],
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        password: [
            '',
            [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/)
            ]
        ],
        repeat_password: ['', Validators.required]
    }, { validators: passwordsMatchValidator });

    async onSubmit(): Promise<void> {

        if (this.registerForm.invalid || this.isSubmitting()) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.errorMessage.set(null);
        this.isSubmitting.set(true);
        try {
            await firstValueFrom(this.accountService.register(this.registerForm.getRawValue()));
            this.registrationComplete.set(true);
        } catch (error: unknown) {
            console.error('Registration failed', error);
            this.errorMessage.set(getHttpErrormessage(error, 'Unable to create your account. Please try again.'));
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
