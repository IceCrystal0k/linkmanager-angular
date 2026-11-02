import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import ServiceConfig from './service.config';

@Injectable({
    providedIn: 'root'
})
export class AccountService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = ServiceConfig.apiUrl;

    updateProfile(data: any): Observable<any> {
        const formData = new FormData();
        data.forEach((value: string | Blob, key: string) => formData.append(key, value));
        formData.append('_method', 'PATCH');
        return this.http.post<any>(`${this.apiUrl}accounts`, formData);
    }
}
