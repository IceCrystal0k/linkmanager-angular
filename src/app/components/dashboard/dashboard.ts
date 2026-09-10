import { Component, signal, inject, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { CategoryList } from '../category/category-list';

import { LinkService, LinkItem } from '../../services/link'; // Import service & interface

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
    private selectedCategory: any = null;

    isSidebarExpanded = signal(true);
    // Track the currently selected item details
    selectedLink = signal<any>(null);

    // Link our local template variable directly to the read-only Service Signal!
    links = this.linkService.links;

    ngOnInit() {
        this.loadInitialData();
    }

    loadInitialData() {
        this.linkService.fetchLinks().subscribe({
            next: (data) => console.log('Links synced successfully from backend!'),
            error: (err) => console.error('Failed to resolve links payload', err)
        });
    }

    toggleSidebar() {
        this.isSidebarExpanded.update((val) => !val);
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
