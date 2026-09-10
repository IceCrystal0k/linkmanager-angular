import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';

// Define a strict TypeScript interface for your Link data structure
export interface LinkItem {
    id: number;
    name: string;
    url: string;
    category_id: number;
    category: { id: number; name: string };
    description: string;
    username?: string;
    password?: string;
}

@Injectable({
    providedIn: 'root'
})
export class LinkService {
    private http = inject(HttpClient);
    private apiUrl = ServiceConfig.apiUrl;

    // The single source of truth for your links state across the app
    private linksSignal = signal<LinkItem[]>([]);
    readonly links = this.linksSignal.asReadonly();

    // 1. GET: Fetch all links from the API and update the signal
    fetchLinks(): Observable<HttpListResponse> {
        return this.http.get<HttpListResponse>(`${this.apiUrl}links`).pipe(
            tap((data) => this.linksSignal.set(data.data)) // Updates the global signal state smoothly
        );
    }

    // 2. POST: Create a new link
    createLink(newLink: Partial<LinkItem>): Observable<LinkItem> {
        return this.http.post<LinkItem>(this.apiUrl, newLink).pipe(
            tap((createdLink) => {
                // Optimistically add the new item to our local signal array instantly
                this.linksSignal.update((currentLinks) => [...currentLinks, createdLink]);
            })
        );
    }

    // 3. PUT: Update an existing link
    updateLink(id: number, updatedData: Partial<LinkItem>): Observable<LinkItem> {
        return this.http.put<LinkItem>(`${this.apiUrl}/${id}`, updatedData).pipe(
            tap((savedLink) => {
                // Map over the signal array and replace the old item with the updated one
                this.linksSignal.update((currentLinks) => currentLinks.map((link) => (link.id === id ? savedLink : link)));
            })
        );
    }

    // 4. DELETE: Erase a link
    deleteLink(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                // Remove the item from our local signal array
                this.linksSignal.update((currentLinks) => currentLinks.filter((link) => link.id !== id));
            })
        );
    }
}
