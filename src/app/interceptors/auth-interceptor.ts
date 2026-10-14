import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const isLoginPageRequest = router.url.split(/[?#]/)[0] === '/login';
    const handleUnauthorized = <T>(response: Observable<HttpEvent<T>>) => response.pipe(
        catchError((error: unknown) => {
            if (
                error instanceof HttpErrorResponse
                && error.status === 401
                && typeof window !== 'undefined'
                && !isLoginPageRequest
            ) {
                void router.navigateByUrl('/login');
            }

            return throwError(() => error);
        })
    );

    if (typeof window === 'undefined') {
        return handleUnauthorized(next(req));
    }
    const token = localStorage.getItem('auth_token');

    if (!token) {
        return handleUnauthorized(next(req));
    }

    // If a token exists, clone the request and append the Authorization header
    const clonedRequest = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    // Pass the modified request forward into the HTTP pipeline
    return handleUnauthorized(next(clonedRequest));
};
