import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';

// Define a strict TypeScript interface for your Category data structure
export interface CategoryItem {
    id: number;
    name: string;
    slug: string;
    order_index: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);
    private apiUrl = ServiceConfig.apiUrl;

    // The single source of truth for your categories state across the app
    private categorySignal = signal<CategoryItem[]>([]);
    readonly categories = this.categorySignal.asReadonly();

    // 1. GET: Fetch all categories from the API and update the signal
    fetchCategories(): Observable<CategoryItem[]> {
        return this.http.get<CategoryItem[]>(this.apiUrl).pipe(
            tap((data) => this.categorySignal.set(data)) // Updates the global signal state smoothly
        );
    }

    // 2. POST: Create a new category
    createCategory(newCategory: Partial<CategoryItem>): Observable<CategoryItem> {
        return this.http.post<CategoryItem>(this.apiUrl, newCategory).pipe(
            tap((createdCategory) => {
                // Optimistically add the new item to our local signal array instantly
                this.categorySignal.update((currentCategories) => [...currentCategories, createdCategory]);
            })
        );
    }

    // 3. PUT: Update an existing category
    updateCategory(id: number, updatedData: Partial<CategoryItem>): Observable<CategoryItem> {
        return this.http.put<CategoryItem>(`${this.apiUrl}/${id}`, updatedData).pipe(
            tap((savedCategory) => {
                // Map over the signal array and replace the old item with the updated one
                this.categorySignal.update((currentCategories) =>
                    currentCategories.map((category) => (category.id === id ? savedCategory : category))
                );
            })
        );
    }

    // 4. DELETE: Erase a category
    deleteCategory(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                // Remove the item from our local signal array
                this.categorySignal.update((currentCategories) => currentCategories.filter((category) => category.id !== id));
            })
        );
    }
}
