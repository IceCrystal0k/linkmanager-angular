import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
    hasError = signal(false);

    ngOnInit(): void {
        const params = this.route.snapshot.queryParamMap;
        const code = params.get('exc'); // get exchange code from query params
        const uid = params.get('uid');
        if (!code || !uid) {
            this.hasError.set(true);
            return;
        }
        this.authService.completeSocialLogin(code, uid, this.onSocialLogin, this.onSocialError);
    }

    onSocialLogin(response: any) {
        console.log('social login', response);
        // this.router.navigate(['/dashboard']);
    }

    onSocialError(err: any) {
        console.log('Error on social login:', err);
        this.hasError.set(true);
    }
}
