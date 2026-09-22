import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';

// Define a strict TypeScript interface for your Category data structure
export interface CategoryModel {
    id: string;
    module_id: string;
    name: string;
    slug: string;
    parent_id: string | null;
    order_index: number;
    description: string;
    children?: CategoryModel[];
}

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);
    private apiUrl = ServiceConfig.apiUrl;

    // The single source of truth for your categories state across the app
    private categorySignal = signal<CategoryModel[]>([]);
    readonly categories = this.categorySignal.asReadonly();

    fetchItemsStatic() {
        const categories = <CategoryModel[]>[
            {
                name: 'Work',
                module_id: 'links',
                id: 'work',
                parent_id: null,
                children: [
                    { name: 'Projects', id: 'work-projects', module_id: 'links', parent_id: 'work' },
                    { name: 'Credentials', id: 'work-credentials', module_id: 'links', parent_id: 'work' },
                    { name: 'Documentation', id: 'work-docs', module_id: 'links', parent_id: 'work' }
                ]
            },
            {
                name: 'Personal',
                id: 'personal',
                module_id: 'links',
                parent_id: null,
                children: [
                    {
                        name: 'Finance',
                        id: 'pers-finance',
                        module_id: 'links',
                        parent_id: 'personal',
                        children: [
                            {
                                name: 'Green',
                                id: 'pers-finance-green',
                                module_id: 'links',
                                parent_id: 'pers-finance',
                                children: [
                                    {
                                        name: 'Broccoli',
                                        id: 'pers-finance-green-brocoli',
                                        module_id: 'links',
                                        parent_id: 'pers-finance-green'
                                    },
                                    {
                                        name: 'Brussels sprouts',
                                        id: 'pers-finance-green-bussels-sprouts',
                                        module_id: 'links',
                                        parent_id: 'pers-finance-green'
                                    }
                                ]
                            },
                            {
                                name: 'Orange',
                                id: 'pers-finance-orange',
                                module_id: 'links',
                                parent_id: 'pers-finance',
                                children: [
                                    {
                                        name: 'Pumpkins',
                                        id: 'pers-finance-orange-pumpkin',
                                        module_id: 'links',
                                        parent_id: 'pers-finance-orange'
                                    },
                                    {
                                        name: 'Carrots',
                                        id: 'pers-finance-orange-carrots',
                                        module_id: 'links',
                                        parent_id: 'pers-finance-orange'
                                    }
                                ]
                            }
                        ],
                    },
                    {
                        name: 'Shopping',
                        id: 'pers-shopping',
                        module_id: 'links',
                        parent_id: 'personal',
                        children: [
                            {
                                name: 'Green',
                                id: 'pers-shopping-green',
                                module_id: 'links',
                                parent_id: 'pers-shopping',
                                children: [
                                    {
                                        name: 'Broccoli',
                                        id: 'shopping-green-brocoli',
                                        module_id: 'links',
                                        parent_id: 'pers-shopping-green'
                                    },
                                    {
                                        name: 'Brussels sprouts',
                                        id: 'shopping-green-bussels-sprouts',
                                        module_id: 'links',
                                        parent_id: 'pers-shopping-green'
                                    }
                                ]
                            },
                            {
                                name: 'Orange',
                                id: 'pers-shopping-orange',
                                module_id: 'links',
                                parent_id: 'pers-shopping',
                                children: [
                                    {
                                        name: 'Pumpkins',
                                        id: 'shopping-orange-pumpkin',
                                        module_id: 'links',
                                        parent_id: 'pers-shopping-orange'
                                    },
                                    {
                                        name: 'Carrots',
                                        id: 'shopping-orange-carrots',
                                        module_id: 'links',
                                        parent_id: 'pers-shopping-orange'
                                    }
                                ]
                            }
                        ],
                    }
                ]
            },
            {
                name: 'Entertainment',
                id: 'entertainment',
                module_id: 'books',
                parent_id: null
            }
        ];
        this.categorySignal.set(categories);
    }

    // 1. GET: Fetch all categories from the API and update the signal
    fetchItems(): Observable<CategoryModel[]> {
        return this.http.get<CategoryModel[]>(this.apiUrl).pipe(
            tap((data) => this.categorySignal.set(data)) // Updates the global signal state smoothly
        );
    }

    // 2. POST: Create a new category
    createItem(newCategory: Partial<CategoryModel>): Observable<CategoryModel> {
      this.categorySignal.update((currentCategories) => [...currentCategories, newCategory as CategoryModel]);
      return <any>null;
      // return this.http.post<CategoryModel>(this.apiUrl, newCategory).pipe(
        //     tap((createdCategory) => {
        //         // Optimistically add the new item to our local signal array instantly
        //         this.categorySignal.update((currentCategories) => [...currentCategories, createdCategory]);
        //     })
        // );
    }

    // 3. PUT: Update an existing category
    updateItem(id: string, updatedData: Partial<CategoryModel>): Observable<CategoryModel> {
        return this.http.put<CategoryModel>(`${this.apiUrl}/${id}`, updatedData).pipe(
            tap((savedCategory) => {
                // Map over the signal array and replace the old item with the updated one
                this.categorySignal.update((currentCategories) =>
                    currentCategories.map((category) => (category.id === id ? savedCategory : category))
                );
            })
        );
    }

    // 4. DELETE: Erase a category
    deleteItem(id: string): Observable<void> {
        this.categorySignal.update((currentCategories) => this.removeItem(currentCategories, id));
        // return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        //     tap(() => {
        //         this.categorySignal.update((currentCategories) => this.removeCategory(currentCategories, id));
        //     })
        // );
        return <any>null;
    }

    private removeItem(list: CategoryModel[], id: string): CategoryModel[] {
        return list
            .filter((item) => item.id !== id)
            .map((item) => ({
                ...item,
                children: item.children
                    ? this.removeItem(item.children, id)
                    : item.children
            }));
    }

    // private addItem(list: CategoryModel[], newItem: CategoryModel): CategoryModel[] {
    //     if (!newItem.parent_id) {
    //         return [...list, newItem];
    //     }
    //   }
}
