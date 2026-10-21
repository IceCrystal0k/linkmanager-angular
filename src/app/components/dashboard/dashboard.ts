import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { finalize } from 'rxjs';

import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { CategoryList, CategoryOption } from '../category/category-list';
import { SkeletonLoader } from '../common/skeleton-loader';
import { SpinnerLoader } from '../common/spinner-loader';

import { LinkService, LinkModel } from '../../services/link'; // Import service & interface
import { CategoryService, CategoryModel } from '../../services/category';
import { ModuleService } from '../../services/module';
import { buildTree, flattenTree } from '../../lib/array-util';

@Component({
    imports: [
        MatSidenavModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        CategoryList,
        SkeletonLoader,
        SpinnerLoader
    ],
    selector: 'app-dashboard',
    styleUrl: './dashboard.scss',
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
    protected readonly title = signal('organizer');
    private router = inject(Router);
    private authService = inject(AuthService); // Inject the service

    // Inject your isolated domain service
    private linkService = inject(LinkService);
    private categoryService = inject(CategoryService);
    private moduleService = inject(ModuleService);
    selectedCategory = signal<CategoryOption | null>(null);
    private categoriesLoading = false;
    private modulesLoading = false;

    icon1 = signal('link');
    icon2 = signal('folder');

    isSidebarExpanded = signal(true);
    isModulesLoading = signal(false);
    isLinksLoading = signal(false);
    categoryToast = signal<string | null>(null);
    // Track the currently selected item details
    selectedLink = signal<any>(null);
    private categoryToastTimeout?: ReturnType<typeof setTimeout>;

    // Link our local template variable directly to the read-only Service Signal!
    links = this.linkService.links;
    categories = this.categoryService.categories;
    modules = this.moduleService.modules;
    // Build a tree structure from the flat category list for display
    categoryTreeData = computed(() => buildTree(this.categories()));
    // Flatten the tree structure for display in a dropdown list
    // categoryList = computed(() => flattenTree(this.categoryTree()));
    categoryListData = computed(() => flattenTree(this.categoryTreeData()));

    ngOnInit() {
        this.loadInitialData();
    }

    ngOnDestroy() {
        clearTimeout(this.categoryToastTimeout);
    }

    showCategoryToast(message: string) {
        clearTimeout(this.categoryToastTimeout);
        this.categoryToast.set(message);
        this.categoryToastTimeout = setTimeout(() => this.categoryToast.set(null), 3500);
    }

    loadInitialData() {
        if (typeof window === 'undefined') {
            console.warn('Window object is not available. Skipping localStorage access.');
            return;
        }
        console.log('Token at startup:', localStorage.getItem('auth_token'));
        this.fetchModules();
        this.fetchCategories();
        this.fetchLinks();
    }

    fetchModules() {
        this.isModulesLoading.set(true);
        this.moduleService
            .fetchItems()
            .pipe(
                finalize(() => {
                    this.modulesLoading = false;
                    if (!this.categoriesLoading) {
                        this.isModulesLoading.set(false);
                    }
                })
            )
            .subscribe({
                next: (data) => console.log('Modules synced successfully from backend!'),
                error: (err) => console.error('Failed to resolve modules payload', err)
            });
    }

    fetchCategories() {
        this.categoriesLoading = true;
        this.categoryService
            .fetchItems()
            .pipe(
                finalize(() => {
                    this.categoriesLoading = false;
                    if (!this.modulesLoading) {
                        this.isModulesLoading.set(false);
                    }
                })
            )
            .subscribe({
                next: (data) => console.log('Categories synced successfully from backend!'),
                error: (err) => console.error('Failed to resolve categories payload', err)
            });
    }

    fetchLinks() {
        this.isLinksLoading.set(true);
        this.linkService
            .fetchItems()
            .pipe(finalize(() => this.isLinksLoading.set(false)))
            .subscribe({
                next: (data) => console.log('Links synced successfully from backend!'),
                error: (err) => console.error('Failed to resolve links payload', err)
            });
    }

    log(data: any) {
        console.log(data);
    }

    toggleSidebar() {
        this.isSidebarExpanded.update((val) => !val);
        this.icon1.update((val) => (val === 'link' ? 'menu' : 'link'));
    }

    selectLink(link: any) {
        console.log(link);
        this.selectedLink.set(link);
    }

    onSignOut() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    handleCategorySelection(category: CategoryOption) {
        console.log('Clicked category captured from child tree component:', category);
        this.selectedCategory.set(category);
        // We can now use this category name to pass into our upcoming RxJS search filter!
    }

    /**
     * Handles the deselection of a category.
     * @param categoryId category id
     */
    handleCategoryDeselection(categoryId: number) {
        console.log('Clicked category captured from child tree component:', categoryId);
        const selectedCategory = this.selectedCategory();
        // Deselect the category if it matches the currently selected category or its parent
        if (selectedCategory && (
            selectedCategory.id === categoryId ||
            selectedCategory.parentIds?.includes(categoryId)
        )) {
            this.selectedCategory.set(null);
        }
        // We can now use this category name to pass into our upcoming RxJS search filter!
    }
}
