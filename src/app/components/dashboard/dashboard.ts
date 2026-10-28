import { Component, signal, inject, OnInit, OnDestroy, computed } from '@angular/core';
import { finalize, firstValueFrom, of } from 'rxjs';

import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth';
import { CategoryList, CategoryOption, LinkUpdatedEvent } from '../category/category-list';
import { ConfirmDialog } from '../common/dialogs/confirm-dialog';
import { SkeletonLoader } from '../common/skeleton-loader';
import { SpinnerLoader } from '../common/spinner-loader';
import { UiDialogService } from '../../services/ui-dialog';
import { LinkEdit } from '../category/link-edit';

import { LinkService, LinkModel } from '../../services/link'; // Import service & interface
import { CategoryService, CategoryModel } from '../../services/category';
import { ModuleService } from '../../services/module';
import { buildTree, flattenTree } from '../../lib/array-util';
import { getHttpErrormessageAsString } from '../../lib/http-util';
import { response } from 'express';

@Component({
    imports: [MatSidenavModule, MatListModule, MatButtonModule, MatIconModule, CategoryList, SkeletonLoader, SpinnerLoader],
    selector: 'app-dashboard',
    styleUrl: './dashboard.scss',
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
    protected readonly title = signal('organizer');
    private router = inject(Router);
    private authService = inject(AuthService); // Inject the service
    private dialogService = inject(UiDialogService); // Inject the service

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

    private linksCachedMap = new Map<number, LinkModel[]>();

    // Link our local template variable directly to the read-only Service Signal!
    links = signal<LinkModel[]>([]);
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

    showCategoryToast(message: string, duration: number = 3500) {
        clearTimeout(this.categoryToastTimeout);
        this.categoryToast.set(message);
        this.categoryToastTimeout = setTimeout(() => this.categoryToast.set(null), duration);
    }

    loadInitialData() {
        if (typeof window === 'undefined') {
            console.warn('Window object is not available. Skipping localStorage access.');
            return;
        }
        console.log('Token at startup:', localStorage.getItem('auth_token'));
        this.fetchModules();
        this.fetchCategories();
        // this.fetchLinks();
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
                error: (err) => {
                    // show a user-friendly error message in the UI
                    const errorMessage = getHttpErrormessageAsString(err, 'Failed to load modules. Please try again later.');
                    this.showCategoryToast(errorMessage, 7000);
                    console.error('Failed to resolve modules payload', err);
                }
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

    fetchLinks(categoryId: number) {
        const cached = this.linksCachedMap.get(categoryId);
        if (cached) {
            this.links.set(cached);
            return;
        }

        this.isLinksLoading.set(true);
        this.linkService
            .fetchItems({ category_id: categoryId })
            .pipe(finalize(() => this.isLinksLoading.set(false)))
            .subscribe({
                next: (data) => {
                    console.log('Links synced successfully from backend!');
                    this.links.set(data.data);
                    this.linksCachedMap.set(categoryId, data.data); // Cache the links for this category
                },
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
        this.fetchLinks(category.id); // Fetch links for the selected category
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
        if (selectedCategory && (selectedCategory.id === categoryId || selectedCategory.parentIds?.includes(categoryId))) {
            this.selectedCategory.set(null);
        }
        // We can now use this category name to pass into our upcoming RxJS search filter!
    }

    // eventData : {link: LinkModel, action: 'add' | 'update' | 'delete'}
    updateLinkList(eventData: LinkUpdatedEvent) {
        const { link, action } = eventData;
        const currentLinks = this.links() || [];
        const existingLink = currentLinks?.find((l) => l.id === link.id) || [];

        if (action === 'add') {
            this.links.set([...currentLinks, link]);
            this.linksCachedMap.set(link.category_id, this.links());
        } else if (action === 'update' && existingLink) {
            let updatedLinks;
            // if category changed, remove the item from current links
            if (link.category_id !== this.selectedCategory()?.id) {
              updatedLinks = currentLinks.filter((l) => (l.id !== link.id));
              // update the link list in the new category
              const newCategoryUpdatedLinks = this.linksCachedMap.get(link.category_id) || [];
              newCategoryUpdatedLinks.push(link);
              this.linksCachedMap.set(link.category_id, newCategoryUpdatedLinks);
            }
            else {
              updatedLinks = currentLinks.map((l) => (l.id === link.id ? link : l));
            }
            // update the links in the current selected category
            this.links.set(updatedLinks);
            this.linksCachedMap.set(this.selectedCategory()?.id || link.category_id, updatedLinks);

        } else if (action === 'delete' && existingLink) {
            const updatedLinks = currentLinks.filter((l) => l.id !== link.id);
            this.links.set(updatedLinks);
            this.linksCachedMap.set(link.category_id, updatedLinks);
        }
    }

    onLinkEdit() {
        const selectedLink = this.selectedLink();
        if (!selectedLink) {
            console.warn('No link selected for editing.');
            return;
        }
        this.editLink(selectedLink);
    }

    getCategoryListForDropdown(): CategoryOption[] {
        const moduleCategories = this.categoryListData().filter(
            (category) => category.module_id === this.selectedCategory()?.module_id
        );
        return moduleCategories;
    }

    editLink(item: LinkModel | null) {
        if (!item) {
            console.warn('No category selected for creating a link.');
            return;
        }

        const dialogRef = this.dialogService.openEdit(
            LinkEdit,
            {
                title: 'Edit link',
                componentInputs: {
                    name: item.name,
                    url: item.url,
                    category_id: item.category_id,
                    description: item.description,
                    comment: item.comment
                },
                data: {
                    categories: this.getCategoryListForDropdown()
                },
                id: item.id,
                saveCallback: (id: number, result: Partial<LinkModel> | false) => this.saveLinkHandler(id, result, 'update')
            },
            { width: '480px' }
        );

        dialogRef.afterClosed().subscribe((result: Partial<LinkModel> | false | undefined) => {
            if (result == null || result === false) {
                return;
            }
            this.showCategoryToast('Link updated successfully.');
        });
    }

    private async saveLinkHandler(
        _id: number,
        data: Partial<LinkModel> | false,
        action: 'add' | 'update' | 'delete'
    ): Promise<LinkModel | false> {
        if (data === false) {
            return false;
        }

        const response = await firstValueFrom(this.linkService.updateItem(_id, data));
        const linkUpdatedEvent: LinkUpdatedEvent = {
            link: response.data,
            action: action
        };
        this.updateLinkList(linkUpdatedEvent);
        this.selectedLink.set(response.data);
        return response.data;
    }

    onLinkDelete() {
        const item = this.selectedLink();
        if (!item) {
            console.warn('No link selected for deletion.');
            return;
        }

        const dialogData = {
            title: 'Confirm Deletion',
            content: `Are you sure you want to delete the link **${item.name ?? ''}**? This action cannot be undone.`
        };
        const dialogRef = this.dialogService.open(ConfirmDialog, dialogData, {
            width: '400px'
        });

        const linkUpdatedEvent: LinkUpdatedEvent = {
            link: item,
            action: 'delete'
        };

        dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
            if (confirmed && item.id) {
                this.linkService.deleteItem(item.id).subscribe({
                    next: () => {
                        console.log('Link deleted:', item.id);
                        this.showCategoryToast('Link deleted successfully.');

                        this.updateLinkList(linkUpdatedEvent);
                        this.selectedLink.set(null);
                    },
                    error: (error: unknown) => {
                        console.error('Failed to delete link', error);
                        this.showCategoryToast('Failed to delete link.');
                    }
                });
                return;
            }

            console.log('Delete cancelled for link:', item.id);
        });
    }
}
