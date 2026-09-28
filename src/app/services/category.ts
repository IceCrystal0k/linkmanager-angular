import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import ServiceConfig from '../services/service.config';

// Define a strict TypeScript interface for your Category data structure
export interface CategoryModel {
    id: number;
    module_id: number;
    name: string;
    slug: string;
    parent_id: number | null;
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
                module_id: 1,
                id: 1,
                parent_id: null,
                children: [
                    { name: 'Projects', id: 2, module_id: 1, parent_id: 1 },
                    { name: 'Credentials', id: 3, module_id: 1, parent_id: 1 },
                    { name: 'Documentation', id: 4, module_id: 1, parent_id: 1 }
                ]
            },
            {
                name: 'Personal',
                id: 5,
                module_id: 1,
                parent_id: null,
                children: [
                    {
                        name: 'Finance',
                        id: 6,
                        module_id: 1,
                        parent_id: 5,
                        children: [
                            {
                                name: 'Green',
                                id: 7,
                                module_id: 1,
                                parent_id: 6,
                                children: [
                                    {
                                        name: 'Broccoli',
                                        id: 8,
                                        module_id: 1,
                                        parent_id: 7
                                    },
                                    {
                                        name: 'Brussels sprouts',
                                        id: 9,
                                        module_id: 1,
                                        parent_id: 7
                                    }
                                ]
                            },
                            {
                                name: 'Orange',
                                id: 10,
                                module_id: 1,
                                parent_id: 6,
                                children: [
                                    {
                                        name: 'Pumpkins',
                                        id: 11,
                                        module_id: 1,
                                        parent_id: 10
                                    },
                                    {
                                        name: 'Carrots',
                                        id: 12,
                                        module_id: 1,
                                        parent_id: 10
                                    }
                                ]
                            }
                        ],
                    },
                    {
                        name: 'Shopping',
                        id: 13,
                        module_id: 1,
                        parent_id: 5,
                        children: [
                            {
                                name: 'Green',
                                id: 14,
                                module_id: 1,
                                parent_id: 13,
                                children: [
                                    {
                                        name: 'Broccoli',
                                        id: 16,
                                        module_id: 1,
                                        parent_id: 14
                                    },
                                    {
                                        name: 'Brussels sprouts',
                                        id: 17,
                                        module_id: 1,
                                        parent_id: 14
                                    }
                                ]
                            },
                            {
                                name: 'Orange',
                                id: 15,
                                module_id: 1,
                                parent_id: 13,
                                children: [
                                    {
                                        name: 'Pumpkins',
                                        id: 18,
                                        module_id: 1,
                                        parent_id: 15
                                    },
                                    {
                                        name: 'Carrots',
                                        id: 19,
                                        module_id: 1,
                                        parent_id: 15
                                    }
                                ]
                            }
                        ],
                    }
                ]
            },
            {
                name: 'Entertainment',
                id: 20,
                module_id: 2,
                parent_id: null
            }
        ];
        this.categorySignal.set(categories);
    }

    // 1. GET: Fetch all categories from the API and update the signal
    fetchItems(): Observable<HttpListResponse> {
        return this.http.get<HttpListResponse>(`${this.apiUrl}categories`).pipe(
            tap((data) => {
                console.log('Fetched categories from API:', (data.data as any).children);
                return this.categorySignal.set((data.data as any).children); // Updates the global signal state smoothly
            })
        );
    }

    // 2. POST: Create a new category
    createItem(newCategory: Partial<CategoryModel>): Observable<CategoryModel> {
            const category = newCategory as CategoryModel;
            this.categorySignal.update((currentCategories) =>
                    category.parent_id
                            ? this.addListItem(currentCategories, category)
                            : [...currentCategories, category]
            );
            return <any>null;
      // return this.http.post<CategoryModel>(`${this.apiUrl}categories`, newCategory).pipe(
        //     tap((createdCategory) => {
        //         // Optimistically add the new item to our local signal array instantly
        //         this.categorySignal.update((currentCategories) => [...currentCategories, createdCategory]);
        //     })
        // );
    }

    // 3. PUT: Update an existing category
    updateItem(id: number, updatedData: Partial<CategoryModel>): Observable<CategoryModel> {
        this.categorySignal.update((currentCategories) => this.updateListItem(currentCategories, { ...updatedData, id } as CategoryModel));
        return <any>null;
        // return this.http.put<CategoryModel>(`${this.apiUrl}categories/${id}`, updatedData).pipe(
        //     tap((savedCategory) => {
        //         // Map over the signal array and replace the old item with the updated one
        //         this.categorySignal.update((currentCategories) =>
        //             currentCategories.map((category) => (category.id === id ? savedCategory : category))
        //         );
        //     })
        // );
    }

    // 4. DELETE: Erase a category
    deleteItem(id: number): Observable<void> {
        this.categorySignal.update((currentCategories) => this.removeListItem(currentCategories, id));
        return <any>null;
        // return this.http.delete<void>(`${this.apiUrl}categories/${id}`).pipe(
        //     tap(() => {
        //         this.categorySignal.update((currentCategories) => this.removeCategory(currentCategories, id));
        //     })
        // );
    }

    private removeListItem(list: CategoryModel[], id: number): CategoryModel[] {
        return list
            .filter((item) => item.id !== id)
            .map((item) => ({
                ...item,
                children: item.children
                    ? this.removeListItem(item.children, id)
                    : item.children
            }));
    }

    private addListItem(list: CategoryModel[], newItem: CategoryModel): CategoryModel[] {
        return list.map((item) => {
            if (item.id === newItem.parent_id) {
                return {
                    ...item,
                    children: [...(item.children ?? []), newItem]
                };
            }

            return item.children
                ? { ...item, children: this.addListItem(item.children, newItem) }
                : item;
        });
      }

      private updateListItem(list: CategoryModel[], newItem: CategoryModel): CategoryModel[] {
        const listItem = this.getCategoryById(list, newItem.id);
        if (!listItem) {
            console.warn(`Category with id ${newItem.id} not found for update.`);
            return list;
        }
        // If the parent_id has changed, we need to remove it from the old parent and add it to the new parent
        if (listItem.parent_id !== newItem.parent_id) {
            // preserve the children
            newItem.children = listItem.children;
            // Remove from old parent
            list = this.removeListItem(list, newItem.id);
            // Add to new parent
            if (newItem.parent_id) {
                list = this.addListItem(list, newItem);
            }
            return list;
        }

        // If the parent_id hasn't changed, we can just update the item in place
        return list.map((item) => {
            if (item.id === newItem.id) {
                return {...newItem };
            }

            return item.children
                ? { ...item, children: this.updateListItem(item.children, newItem) }
                : item;
        });
      }

      private getCategoryById(list: CategoryModel[], id: number): CategoryModel | null {
        for (const item of list) {
            if (item.id === id) {
                return item;
            }
            if (item.children) {
                const found = this.getCategoryById(item.children, id);
                if (found) {
                    return found;
                }
            }
        }
        return null;
      }
}
