import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    if (typeof window === 'undefined') {
        return next(req);
    }
    const token = localStorage.getItem('auth_token');

    // If a token exists, clone the request and append the Authorization header
    if (!token) {
        return next(req);
    }

    const clonedRequest = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`
        }
    });

    // Pass the modified request forward into the HTTP pipeline
    return next(clonedRequest);
};
