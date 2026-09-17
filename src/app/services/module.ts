import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';
import { CategoryModel } from './category';

// Define a strict TypeScript interface for your Module data structure
export interface ModuleModel {
    id: string;
    name: string;
    slug: string;
    icon: string;
    order_index: number;
    description: string;
    enabled: boolean;
    children?: CategoryModel[]; // Optional property for nested modules
}

@Injectable({
    providedIn: 'root'
})
export class ModuleService {
    private http = inject(HttpClient);
    private apiUrl = ServiceConfig.apiUrl;

    // The single source of truth for your modules state across the app
    private moduleSignal = signal<ModuleModel[]>([]);
    readonly modules = this.moduleSignal.asReadonly();

    fetchModulesStatic() {
        const modules = <ModuleModel[]>[
            {
                id: 'links',
                name: 'Personal Links',
                slug: 'personal-links',
                order_index: 1,
                description: 'A module for managing personal links and bookmarks.',
                enabled: true,
                icon: 'link'
            },
            {
                name: 'Books',
                id: 'books',
                slug: 'books',
                order_index: 2,
                description: 'A module for managing a collection of books.',
                enabled: true,
                icon: 'book'
            },
            {
                name: 'Entertainment',
                id: 'entertainment',
                slug: 'entertainment',
                order_index: 3,
                description: 'A module for managing entertainment-related content.',
                enabled: false,
                icon: 'movie'
            }
        ];
        this.moduleSignal.set(modules);
    }

    // 1. GET: Fetch all modules from the API and update the signal
    fetchModules(): Observable<ModuleModel[]> {
        return this.http.get<ModuleModel[]>(this.apiUrl).pipe(
            tap((data) => this.moduleSignal.set(data)) // Updates the global signal state smoothly
        );
    }

    // 2. POST: Create a new module
    createModule(newModule: Partial<ModuleModel>): Observable<ModuleModel> {
        return this.http.post<ModuleModel>(this.apiUrl, newModule).pipe(
            tap((createdModule) => {
                // Optimistically add the new item to our local signal array instantly
                this.moduleSignal.update((currentModules) => [...currentModules, createdModule]);
            })
        );
    }

    // 3. PUT: Update an existing module
    updateModule(id: string, updatedData: Partial<ModuleModel>): Observable<ModuleModel> {
        return this.http.put<ModuleModel>(`${this.apiUrl}/${id}`, updatedData).pipe(
            tap((savedModule) => {
                // Map over the signal array and replace the old item with the updated one
                this.moduleSignal.update((currentModules) =>
                    currentModules.map((module) => (module.id === id ? savedModule : module))
                );
            })
        );
    }

    // 4. DELETE: Erase a module
    deleteModule(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => {
                // Remove the item from our local signal array
                this.moduleSignal.update((currentModules) => currentModules.filter((module) => module.id !== id));
            })
        );
    }
}
