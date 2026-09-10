import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    let token: string | null = null;

    // Safely check for localStorage to ensure compatibility with server-side rendering
    if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token');
    }

    // If a token exists, clone the request and append the Authorization header
    if (token) {
        const clonedRequest = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });

        // Pass the modified request forward into the HTTP pipeline
        return next(clonedRequest);
    }

    // If no token exists, let the original request proceed unmodified (e.g., for Login calls)
    return next(req);
};
