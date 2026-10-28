import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';

interface LinkMutationResponse {
    status: number;
    data: LinkModel;
}

// Define a strict TypeScript interface for your Link data structure
export interface LinkModel {
    id: number;
    name: string;
    url: string;
    category_id: number;
    category: { id: number; name: string };
    comment: string;
    description: string;
    username?: string;
    password?: string;
    rating?: number;
    last_accessed_at?: string;
    last_check_result?: number;
}

@Injectable({
    providedIn: 'root'
})
export class LinkService {
    private http = inject(HttpClient);
    private apiUrl = ServiceConfig.apiUrl;

    // The single source of truth for your links state across the app
    private linksSignal = signal<LinkModel[]>([]);
    readonly links = this.linksSignal.asReadonly();

    // 1. GET: Fetch all links from the API and update the signal
    fetchItems(queryParams: any): Observable<HttpListResponse> {
        const url = new URL(`${this.apiUrl}links`);
        Object.keys(queryParams).forEach((key) => {
            url.searchParams.append(key, queryParams[key]);
        });
        return this.http.get<HttpListResponse>(url.toString()).pipe(
            tap((data) => this.linksSignal.set(data.data)) // Updates the global signal state smoothly
        );
    }

    // 2. POST: Create a new link
    createItem(newLink: Partial<LinkModel>): Observable<LinkMutationResponse> {
        return this.http.post<LinkMutationResponse>(`${this.apiUrl}links`, newLink).pipe(
            tap((response) => {
                // Optimistically add the new item to our local signal array instantly
                this.linksSignal.update((currentLinks) => (currentLinks ? [...currentLinks, response.data] : [response.data]));
            })
        );
    }

    // 3. PUT: Update an existing link
    updateItem(id: number, updatedData: Partial<LinkModel>): Observable<LinkMutationResponse> {
        return this.http.put<LinkMutationResponse>(`${this.apiUrl}links/${id}`, updatedData).pipe(
            tap((response) => {
                // Map over the signal array and replace the old item with the updated one
                this.linksSignal.update((currentLinks) =>
                    currentLinks ? currentLinks.map((link) => (link.id === id ? response.data : link)) : [response.data]
                );
            })
        );
    }

    // 4. DELETE: Erase a link
    deleteItem(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}links/${id}`).pipe(
            tap(() => {
                // Remove the item from our local signal array
                this.linksSignal.update((currentLinks) => currentLinks ? currentLinks.filter((link) => link.id !== id) : []);
            })
        );
    }
}
