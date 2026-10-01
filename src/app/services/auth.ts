import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http'; // 👈 Import HttpClient
import { tap, Observable } from 'rxjs'; // 👈 Import RxJS utilities
import ServiceConfig from '../services/service.config';

@Injectable({
    providedIn: 'root'
})

/**
 * AuthService is responsible for handling user authentication, including login and logout operations. It uses Angular's HttpClient to communicate with the backend API and RxJS for handling asynchronous operations. The service also manages the authentication state using Angular signals and persists the login state in localStorage for browser sessions.
 */
export class AuthService {
    private http = inject(HttpClient); // 👈 Inject the HTTP Client
    private apiUrl = ServiceConfig.apiUrl;

    // Inject the platform ID token to determine if we are on the server or browser
    private platformId = inject(PLATFORM_ID);

    // A fine-grained signal tracking whether the user is logged in
    private isAuthenticatedSignal = signal<boolean>(this.checkInitialAuthStatus());

    // Read-only public accessor for your components and guards
    readonly isAuthenticated = this.isAuthenticatedSignal.asReadonly();

    startGoogleLogin(): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }

        this.http.get<{ url: string }>(`${this.apiUrl}auth/google`).subscribe((data: any) => {
            // console.log(data.data.url);
            window.location.assign(data.data.url);
        });
    }

    completeSocialLogin(token: string, userId: string, callback: any, error: any): void {
        this.http
            .post<{ url: string; body: any }>(`${this.apiUrl}auth/social/exchange`, { token, uid: userId })
            .pipe(
                tap((data) => {
                    console.log(data);
                })
            )
            .subscribe({
                next: (response) => {
                    callback(response);
                },
                error: (err) => {
                    error(err);
                }
            });
    }

    // Check the initial authentication status based on localStorage
    private checkInitialAuthStatus(): boolean {
        // If running on the server, return false (server doesn't have a localStorage)
        if (!isPlatformBrowser(this.platformId) || typeof localStorage === 'undefined') {
            return false;
        }

        // Read the stored flag from the browser's storage
        return localStorage.getItem('is_user_logged_in') === 'true';
    }

    /**
     * login method sends user credentials to the backend API for authentication.
     * If successful, it updates the authentication state and stores relevant user information in localStorage for session persistence.
     * @param credentials - An object containing user credentials (e.g., username and password) to be sent to the backend for authentication.
     * @returns An Observable that emits the response from the backend API, which includes user information and an authentication token.
     */
    login(credentials: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}sessions`, credentials).pipe(
            tap((response) => {
                this.isAuthenticatedSignal.set(true);
                if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
                    localStorage.setItem('is_user_logged_in', 'true');
                    localStorage.setItem('auth_token', response.data.token); // Save your API token
                    localStorage.setItem('user_name', `${response.data.first_name} ${response.data.last_name}`);
                    localStorage.setItem('role_id', response.data.role_id);
                }
            })
        );
    }

    /**
     * logout method clears the user's authentication state and removes any stored user information from localStorage.
     * This effectively logs the user out of the application.
     * It also updates the authentication signal to reflect that the user is no longer logged in.
     */
    logout() {
        this.isAuthenticatedSignal.set(false);

        if (isPlatformBrowser(this.platformId) && typeof localStorage !== 'undefined') {
            localStorage.removeItem('is_user_logged_in');
            localStorage.removeItem('auth_token');
        }
    }
}
