import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { firstValueFrom } from 'rxjs';
import { getHttpErrormessage } from '../../lib/http-util';
import { AccountService } from '../../services/account';

@Component({
    selector: 'app-email-confirmation',
    standalone: true,
    imports: [MatButtonModule, RouterLink],
    templateUrl: './email-confirmation.html'
})
export class EmailConfirmation implements OnInit {
    private readonly platformId = inject(PLATFORM_ID);
    private readonly route = inject(ActivatedRoute);
    private readonly accountService = inject(AccountService);

    readonly isLoading = signal(true);
    readonly errorMessage = signal<string | string[] | null>(null);
    readonly isConfirmed = signal(false);

    isErrorList(message: string | string[]): message is string[] {
        return Array.isArray(message);
    }

    async ngOnInit(): Promise<void> {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        const token = this.route.snapshot.paramMap.get('token');
        if (!token) {
            this.errorMessage.set('The email confirmation link is missing its token.');
            this.isLoading.set(false);
            return;
        }

        try {
            await firstValueFrom(this.accountService.updateSettings({
                action: 'confirm-email',
                token
            }));
            this.isConfirmed.set(true);
        } catch (error: unknown) {
            console.error('Failed to confirm email', error);
            this.errorMessage.set(getHttpErrormessage(error, 'Unable to confirm your email. Please try again.'));
        } finally {
            this.isLoading.set(false);
        }
    }
}
