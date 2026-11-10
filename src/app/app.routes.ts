import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Register } from './components/login/register';
import { ReconfirmEmail } from './components/login/reconfirm-email';
import { EmailConfirmation } from './components/login/email-confirmation';
import { PasswordReset } from './components/login/password-reset';
import { Dashboard } from './components/dashboard/dashboard';
import { SocialAuthExchange } from './components/login/social-auth-exchange';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'reconfirm-email', component: ReconfirmEmail },
    { path: 'email-confirmation/:token', component: EmailConfirmation },
    { path: 'reset-password/:token', component: PasswordReset },
    { path: 'reset-password', component: PasswordReset },
    { path: 'auth/social/exchange', component: SocialAuthExchange },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },
    { path: '**', redirectTo: 'login' } // Fallback wild-card path
];
