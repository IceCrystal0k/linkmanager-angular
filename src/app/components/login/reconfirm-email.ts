import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';
import { ButtonCustom } from '../common/button-custom';

@Component({
    selector: 'app-reconfirm-email',
    standalone: true,
    imports: [MatButtonModule, ButtonCustom],
    templateUrl: './reconfirm-email.html'
})
export class ReconfirmEmail {
    private readonly accountService = inject(AccountService);

    readonly isSubmitting = signal(false);
    readonly errorMessage = signal<string | string[] | null>(null);
    readonly successMessage = signal<string | null>(null);

    async sendVerificationEmail(): Promise<void> {
        if (this.isSubmitting()) {
            return;
        }

        this.errorMessage.set(null);
        this.successMessage.set(null);
        this.isSubmitting.set(true);
        try {
            await firstValueFrom(this.accountService.sendVerificationEmail({ action: 'verify-email' }));
            this.successMessage.set('A confirmation email has been sent. Please check your inbox.');
        } catch (error: unknown) {
            console.error('Failed to send confirmation email', error);
            this.errorMessage.set(getHttpErrormessage(error, 'Unable to send a confirmation email. Please try again.'));
        } finally {
            this.isSubmitting.set(false);
        }
    }
}
