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
