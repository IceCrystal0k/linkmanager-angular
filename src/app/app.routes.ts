import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Dashboard } from './components/dashboard/dashboard';
import { SocialAuthExchange } from './components/login/social-auth-exchange';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'auth/social/exchange', component: SocialAuthExchange },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' } // Fallback wild-card path
];
