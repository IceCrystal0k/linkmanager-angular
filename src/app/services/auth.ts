import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // 👈 Import HttpClient
import { tap, Observable } from 'rxjs'; // 👈 Import RxJS utilities
import ServiceConfig from '../services/service.config';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient); // 👈 Inject the HTTP Client
    private apiUrl = ServiceConfig.apiUrl;

    // Inject the platform ID token to determine if we are on the server or browser
    private platformId = inject(PLATFORM_ID);

    // A fine-grained signal tracking whether the user is logged in
    private isAuthenticatedSignal = signal<boolean>(this.checkInitialAuthStatus());

    // Read-only public accessor for your components and guards
    readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

    private checkInitialAuthStatus(): boolean {
        // If running on the server, return false (server doesn't have a localStorage)
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }

        // Read the stored flag from the browser's storage
        return localStorage.getItem('is_user_logged_in') === 'true';
    }

    login(credentials: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}sessions`, credentials).pipe(
            tap((response) => {
                this.isAuthenticatedSignal.set(true);
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('is_user_logged_in', 'true');
                    localStorage.setItem('auth_token', response.data.token); // Save your API token
                    localStorage.setItem('user_name', `${response.data.first_name} ${response.data.last_name}`);
                    localStorage.setItem('role_id', response.data.role_id);
                }
            })
        );
    }

    logout() {
        this.isAuthenticatedSignal.set(false);

        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('is_user_logged_in');
            localStorage.removeItem('auth_token');
        }
    }
}
