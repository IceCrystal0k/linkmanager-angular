import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-google-auth-callback',
    standalone: true,
    imports: [RouterLink],
    template: `
        @if (hasError()) {
            <main class="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-900 px-4 text-center text-white">
                <h1 class="text-xl font-semibold">Google sign-in could not be completed</h1>
                <a routerLink="/login" class="text-sm text-blue-300 underline">Return to sign in</a>
            </main>
        } @else {
            <main class="flex min-h-screen items-center justify-center bg-slate-900 px-4 text-white">
                <p>Completing Google sign-in...</p>
            </main>
        }
    `
})
export class SocialAuthExchange implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);
    private platformId = inject(PLATFORM_ID); // Inject the platform context
    hasError = signal(false);

    ngOnInit(): void {

        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        const params = this.route.snapshot.queryParamMap;
        const code = params.get('exc'); // get exchange code from query params
        const uid = params.get('uid');
        if (!code || !uid) {
            this.hasError.set(true);
            return;
        }
        this.authService.completeSocialLogin(code, uid).subscribe({
            next: (response: any) => {
                console.log('Social login successful', response);
                this.authService.setAuthData(response.data);
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.hasError.set(true);
            }
        });
    }
}
