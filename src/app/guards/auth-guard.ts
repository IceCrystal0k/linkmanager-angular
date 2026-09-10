import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID); // Inject the platform context

    // 1. If running on the server, allow it to pass through.
    // The server will render the dashboard frame, letting the browser handle the check.
    if (!isPlatformBrowser(platformId)) {
        return true;
    }

    // Check our central signal state
    if (authService.isAuthenticated()) {
        return true; // Grant access to the route
    }

    // User is unauthenticated -> bounce them back to the login terminal
    router.navigate(['/login']);
    return false;
};
