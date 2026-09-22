import { Component, signal, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { CategoryList } from '../category/category-list';

import { LinkService, LinkItem } from '../../services/link'; // Import service & interface
import { CategoryService } from '../../services/category';
import { ModuleService } from '../../services/module';

@Component({
    imports: [MatSidenavModule, MatListModule, MatButtonModule, MatIconModule, CategoryList],
    selector: 'app-dashboard',
    styleUrl: './dashboard.scss',
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
    protected readonly title = signal('organizer');
    private router = inject(Router);
    private authService = inject(AuthService); // Inject the service
    // Inject your isolated domain service
    private linkService = inject(LinkService);
    private categoryService = inject(CategoryService);
    private moduleService = inject(ModuleService);
    private selectedCategory: any = null;

    icon1 = signal('link');
    icon2 = signal('folder')

    isSidebarExpanded = signal(true);
    // Track the currently selected item details
    selectedLink = signal<any>(null);

    // Link our local template variable directly to the read-only Service Signal!
    links = this.linkService.links;
    categories = this.categoryService.categories;
    modules = this.moduleService.modules;

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        if (typeof window === 'undefined') {
            console.warn('Window object is not available. Skipping localStorage access.');
            return;
        }
        console.log('Token at startup:', localStorage.getItem('auth_token'));
        this.linkService.fetchLinks().subscribe({
            next: (data) => console.log('Links synced successfully from backend!'),
            error: (err) => console.error('Failed to resolve links payload', err)
        });

        this.categoryService.fetchItemsStatic();
        this.moduleService.fetchModulesStatic();
    }

    categoriesForModule(moduleId: string) {
        return this.categories().filter((category) => category.module_id === moduleId);
    }

    toggleSidebar() {
        this.isSidebarExpanded.update((val) => !val);
        this.icon1.update((val) => val === 'link' ? 'menu' : 'link');
    }

    selectLink(link: any) {
        console.log(link);
        this.selectedLink.set(link);
    }

    onSignOut() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    handleCategorySelection(category: any) {
        console.log('Clicked category captured from child tree component:', category);

        if (this.selectedCategory && this.selectedCategory.id !== category.id) {
            this.selectedCategory.isSelected = false;
            console.log('Previous selected category', this.selectedCategory);
        }
        this.selectedCategory = category;
        this.selectedCategory.isSelected = true;
        // We can now use this category name to pass into our upcoming RxJS search filter!
    }
}
