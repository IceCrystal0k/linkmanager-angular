import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
    const interceptor: HttpInterceptorFn = (req, next) => TestBed.runInInjectionContext(() => authInterceptor(req, next));
    let currentRoute: string;
    let navigatedTo: string[];

    beforeEach(() => {
        currentRoute = '/dashboard';
        navigatedTo = [];
        TestBed.configureTestingModule({
            providers: [{
                provide: Router,
                useValue: {
                    get url() {
                        return currentRoute;
                    },
                    navigateByUrl: (url: string) => {
                        navigatedTo.push(url);
                        return Promise.resolve(true);
                    }
                }
            }]
        });
    });

    it('should be created', () => {
        expect(interceptor).toBeTruthy();
    });

    it('should redirect to login on a 401 outside the login page', () => {
        const error = new HttpErrorResponse({ status: 401 });
        const response = interceptor(
            new HttpRequest('GET', '/api/resource'),
            () => throwError(() => error)
        );

        response.subscribe({ error: () => undefined });

        expect(navigatedTo).toEqual(['/login']);
    });

    it('should not redirect when a 401 occurs on the login page', () => {
        currentRoute = '/login';
        const response = interceptor(
            new HttpRequest('POST', '/api/sessions'),
            () => throwError(() => new HttpErrorResponse({ status: 401 }))
        );

        response.subscribe({ error: () => undefined });

        expect(navigatedTo).toEqual([]);
    });
});
