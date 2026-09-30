import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth';
import ServiceConfig from './service.config';

describe('AuthService', () => {
    let service: AuthService;
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(AuthService);
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should request the Google authorization URL', () => {
        service.startGoogleLogin();

        const request = httpTestingController.expectOne(`${ServiceConfig.apiUrl}auth/google`);
        expect(request.request.method).toBe('GET');
        request.flush({ url: 'https://accounts.google.com/oauth' });
    });

    it('should remain unauthenticated when login credentials are rejected', () => {
        const credentials = { username: 'test-user', password: 'wrong-password' };
        let loginError: unknown;

        service.login(credentials).subscribe({
            error: (error: unknown) => (loginError = error)
        });

        const request = httpTestingController.expectOne(`${ServiceConfig.apiUrl}sessions`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(credentials);
        request.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

        expect(loginError).toBeTruthy();
        expect(service.isAuthenticated()).toBeFalsy();
    });

    it('should authenticate when login succeeds', () => {
        const credentials = { username: 'test-user', password: 'test-password' };

        service.login(credentials).subscribe();

        const request = httpTestingController.expectOne(`${ServiceConfig.apiUrl}sessions`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual(credentials);
        request.flush({
            data: {
                token: 'test-token',
                first_name: 'Test',
                last_name: 'User',
                role_id: 1
            }
        });

        expect(service.isAuthenticated()).toBeTruthy();
    });

    it('should authenticate and store the token after Google sign-in', () => {
        service.completeGoogleLogin('google-token', { first_name: 'Google', last_name: 'User', role_id: '2' });

        expect(service.isAuthenticated()).toBeTruthy();
        expect(localStorage.getItem('auth_token')).toBe('google-token');
        expect(localStorage.getItem('user_name')).toBe('Google User');
        expect(localStorage.getItem('role_id')).toBe('2');
    });

    it('should set authentication to false on logout', () => {
        service.login({ username: 'test-user', password: 'test-password' }).subscribe();
        httpTestingController.expectOne(`${ServiceConfig.apiUrl}sessions`).flush({
            data: {
                token: 'test-token',
                first_name: 'Test',
                last_name: 'User',
                role_id: 1
            }
        });

        expect(service.isAuthenticated()).toBeTruthy();

        service.logout();

        expect(service.isAuthenticated()).toBeFalsy();
    });
});
