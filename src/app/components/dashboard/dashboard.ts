import { Component, signal, inject, OnInit, OnDestroy, computed, ViewChild, ElementRef, Injector, afterNextRender } from '@angular/core';
import { DatePipe } from '@angular/common';
import { finalize, firstValueFrom, of, Subscription } from 'rxjs';

import { Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../services/auth';
import { CategoryList, CategoryOption, LinkUpdatedEvent } from '../category/category-list';
import { ConfirmDialog } from '../common/dialogs/confirm-dialog';
import { SkeletonLoader } from '../common/skeleton-loader';
import { SpinnerLoader } from '../common/spinner-loader';
import { UiDialogService } from '../../services/ui-dialog';
import { LinkEdit } from '../category/link-edit';
import { UserProfile } from '../account/user-profile';
import { PasswordChange } from '../account/password-change';
import { UserSettings } from '../account/user-settings';
import { MoveLinksDialog } from './move-links-dialog';

import { LinkService, LinkModel } from '../../services/link'; // Import service & interface
import { CategoryService, CategoryModel } from '../../services/category';
import { AccountService } from '../../services/account';
import { ModuleService, ModuleModel } from '../../services/module';
import { CurrencyType } from '../../services/currency';
import { buildTree, flattenTree } from '../../lib/array-util';
import { getHttpErrormessageAsString } from '../../lib/http-util';

@Component({
    imports: [
        MatSidenavModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatMenuModule,
        CategoryList,
        SkeletonLoader,
        DatePipe,
        SpinnerLoader,
        MatTooltipModule
    ],
    selector: 'app-dashboard',
    styleUrl: './dashboard.scss',
    templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit, OnDestroy {
    protected readonly title = signal('organizer');
    private router = inject(Router);
    private injector = inject(Injector);
    private authService = inject(AuthService); // Inject the service
    private dialogService = inject(UiDialogService); // Inject the service

    // Inject your isolated domain service
    private linkService = inject(LinkService);
    private categoryService = inject(CategoryService);
    private accountService = inject(AccountService);
    private moduleService = inject(ModuleService);
    private categoriesLoading = false;
    private modulesLoading = false;

    tooltipPosition = 'above' as TooltipPosition;
    selectedCategory = signal<CategoryOption | null>(null);
    searchQuery = signal('');
    isSearchInputVisible = signal(false);
    isCheckboxVisible = signal(false);
    selectedLinkIds = signal<Set<number>>(new Set());
    areAllCheckboxesChecked = computed(() => {
        const links = this.links();
        if (!links || links.length === 0) {
            return false;
        }
        return links.length > 0 && links.every((link) => this.selectedLinkIds().has(link.id));
    });

    @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;

    isSidebarExpanded = signal(true);
    isModulesLoading = signal(false);
    isLinksLoading = signal(false);
    userAvatar = signal(typeof localStorage === 'undefined' ? '' : localStorage.getItem('user_avatar')?.trim() || '');
    categoryToast = signal<string | null>(null);
    // Track the currently selected item details
    selectedLink = signal<any>(null);
    private categoryToastTimeout?: ReturnType<typeof setTimeout>;
    private searchTimeout?: ReturnType<typeof setTimeout>;
    private linksRequest?: Subscription;
    private searchRequest?: Subscription;

    private linksCachedMap = new Map<number, LinkModel[]>();

    dateFormat = signal<string>('dd-MM-yy');

    // Link our local template variable directly to the read-only Service Signal!
    links = signal<LinkModel[]>([]);
    categories = this.categoryService.categories;
    modules = this.moduleService.modules;
    // Build a tree structure from the flat category list for display
    categoryTreeData = computed(() => buildTree(this.categories()));
    // Flatten the tree structure for display in a dropdown list
    categoryListData = computed(() => flattenTree(this.categoryTreeData()));

    ngOnInit() {
        this.loadInitialData();
    }

    ngOnDestroy() {
        clearTimeout(this.categoryToastTimeout);
        clearTimeout(this.searchTimeout);
        this.linksRequest?.unsubscribe();
        this.searchRequest?.unsubscribe();
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
        this.dateFormat.set(this.getUserDateFormat());
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

    getCategoryBreadcrumbs(category: CategoryOption, categoryListIndexed: Map<number, CategoryOption>): CategoryOption[] {
        const breadcrumbs: CategoryOption[] = [];
        let currentCategory: CategoryOption | undefined = category;
        while (currentCategory) {
            breadcrumbs.unshift(currentCategory);
            if (!currentCategory.parent_id) {
                break;
            }
            currentCategory = categoryListIndexed.get(currentCategory.parent_id);
        }
        return breadcrumbs;
    }

    transformLinks(links: LinkModel[]): LinkModel[] {
        const categoryListIndexed = new Map<number, CategoryOption>();
        this.categoryListData().forEach((cat) => categoryListIndexed.set(cat.id, cat));
        return links.map((link) => {
            const category = categoryListIndexed.get(link.category_id);
            return {
                ...link,
                breadcrumbs: link.breadcrumbs?.length
                    ? link.breadcrumbs
                    : category
                      ? this.getCategoryBreadcrumbs(category, categoryListIndexed)
                      : []
            };
        });
    }

    fetchLinks(categoryId: number) {
        this.linksRequest?.unsubscribe();
        const cached = this.linksCachedMap.get(categoryId);
        if (cached) {
            this.links.set(cached);
            return;
        }

        this.isLinksLoading.set(true);
        this.linksRequest = this.linkService
            .fetchItems({ category_id: categoryId })
            .pipe(finalize(() => this.isLinksLoading.set(false)))
            .subscribe({
                next: (data) => {
                    console.log('Links synced successfully from backend!');
                    const transformedLinks = data.data;
                    this.links.set(transformedLinks);
                    this.linksCachedMap.set(categoryId, transformedLinks); // Cache the links for this category
                },
                error: (err) => console.error('Failed to resolve links payload', err)
            });
    }

    fetchLinksBySearch(query: string) {
        this.isLinksLoading.set(true);
        this.searchRequest = this.linkService
            .fetchItems({ search: query })
            .pipe(finalize(() => this.isLinksLoading.set(false)))
            .subscribe({
                next: (data) => {
                    this.links.set(this.transformLinks(data.data));
                },
                error: (err) => {
                    const errorMessage = getHttpErrormessageAsString(err, 'Failed to search links. Please try again later.');
                    this.showCategoryToast(errorMessage, 7000);
                    console.error('Failed to search links', err);
                }
            });
    }

    searchLinks(event: Event) {
        const input = event.target;
        if (!(input instanceof HTMLInputElement)) {
            return;
        }

        clearTimeout(this.searchTimeout);
        const previousQuery = this.searchQuery();
        const query = input.value;
        this.searchQuery.set(query);

        if (query.length < 3) {
            if (previousQuery.length >= 3) {
                this.searchRequest?.unsubscribe();
                const category = this.selectedCategory();
                if (category) {
                    this.fetchLinks(category.id);
                } else {
                    this.links.set([]);
                }
            }
            return;
        }

        this.linksRequest?.unsubscribe();
        this.searchRequest?.unsubscribe();
        this.searchTimeout = setTimeout(() => {
            this.fetchLinksBySearch(query);
        }, 500);
    }

    toggleSearchInput() {
        this.isSearchInputVisible.set(!this.isSearchInputVisible());
        afterNextRender(() => this.searchInput?.nativeElement.focus(), {
            injector: this.injector
        });
    }

    clearSearch() {
        const hadSearchQuery = this.searchQuery().length >= 3;
        clearTimeout(this.searchTimeout);
        this.searchRequest?.unsubscribe();
        this.searchQuery.set('');

        if (hadSearchQuery) {
            const category = this.selectedCategory();
            if (category) {
                this.fetchLinks(category.id);
            } else {
                this.links.set([]);
            }
        }
    }

    hideSearchInput() {
        this.isSearchInputVisible.set(false);
    }

    showSelectionCheckbox() {
        this.isCheckboxVisible.set(true);
    }

    selectAllCheckboxes() {
        this.toggleAllSelections(true);
    }

    deselectAllCheckboxes() {
        this.toggleAllSelections(false);
    }

    hideSelectionCheckbox() {
        this.isCheckboxVisible.set(false);
    }

    onSelectionCheckboxChange(checked: boolean) {
        this.toggleAllSelections(checked);
    }

    toggleAllSelections(checked: boolean) {
        const selectedLinkIds = new Set(this.selectedLinkIds());
        for (const link of this.links()) {
            if (checked) {
                selectedLinkIds.add(link.id);
            } else {
                selectedLinkIds.delete(link.id);
            }
        }
        this.selectedLinkIds.set(selectedLinkIds);
    }

    toggleLinkSelection(linkId: number, checked: boolean) {
        this.selectedLinkIds.update((selectedLinkIds) => {
            const updatedLinkIds = new Set(selectedLinkIds);
            if (checked) {
                updatedLinkIds.add(linkId);
            } else {
                updatedLinkIds.delete(linkId);
            }
            return updatedLinkIds;
        });
    }

    moveLinksToCategory() {
        const selectedLinkIds = new Set(this.selectedLinkIds());
        const selectedLinks = this.links().filter((link) => selectedLinkIds.has(link.id));
        const firstSelectedLink = selectedLinks[0];
        if (!firstSelectedLink) {
            console.warn('No selected links are available to move.');
            return;
        }

        const categories = this.getCategoryListForDropdown(firstSelectedLink.category.module_id);
        const dialogRef = this.dialogService.openEdit(
            MoveLinksDialog,
            {
                title: 'Move links',
                cancelButtonText: 'Cancel',
                saveButtonText: 'Move',
                data: { categories },
                saveCallback: (_id: number, categoryId: number | false) => Promise.resolve(categoryId)
            },
            { width: '480px', height: 'auto', maxHeight: '80vh' }
        );

        dialogRef.afterClosed().subscribe((categoryId: number | false | undefined) => {
            if (categoryId == null || categoryId === false) {
                return;
            }

            if (categoryId === firstSelectedLink.category_id) {
                return;
            }

            this.linkService.handleSelectionRequest(selectedLinkIds, 'move', categoryId).subscribe({
                next: () => {
                    for (const [cachedCategoryId, cachedLinks] of this.linksCachedMap) {
                        this.linksCachedMap.set(
                            cachedCategoryId,
                            cachedLinks.filter((link) => !selectedLinkIds.has(link.id))
                        );
                    }
                    this.linksCachedMap.delete(categoryId);
                    this.links.update((links) => links.filter((link) => !selectedLinkIds.has(link.id)));
                    if (this.selectedLink() && selectedLinkIds.has(this.selectedLink().id)) {
                        this.selectedLink.set(null);
                    }
                    this.selectedLinkIds.set(new Set());
                    const category = categories.find((item) => item.id === categoryId);
                    this.showCategoryToast(`Links moved to "${category?.name ?? 'the selected category'}" successfully.`);
                },
                error: (error: unknown) => {
                    const errorMessage = getHttpErrormessageAsString(error, 'Failed to move links. Please try again later.');
                    this.showCategoryToast(errorMessage, 7000);
                    console.error('Failed to move links', error);
                }
            });
        });
    }

    archiveLinks() {
        this.confirmSelectionRequest('archive');
    }

    deleteLinks() {
        this.confirmSelectionRequest('delete');
    }

    private confirmSelectionRequest(action: 'archive' | 'delete') {
        const selectedLinkIds = new Set(this.selectedLinkIds());
        if (selectedLinkIds.size === 0) {
            console.warn(`No selected links are available to ${action}.`);
            return;
        }

        const actionLabel = action === 'archive' ? 'archive' : 'delete';
        const dialogRef = this.dialogService.open(
            ConfirmDialog,
            {
                title: `Confirm ${actionLabel}`,
                content: `Are you sure you want to ${actionLabel} ${selectedLinkIds.size} selected link${selectedLinkIds.size === 1 ? '' : 's'}?`,
                confirmButtonText: action === 'archive' ? 'Archive' : 'Delete'
            },
            { width: '400px' }
        );

        dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
            if (!confirmed) {
                return;
            }

            this.linkService.handleSelectionRequest(selectedLinkIds, action).subscribe({
                next: () => {
                    for (const [cachedCategoryId, cachedLinks] of this.linksCachedMap) {
                        this.linksCachedMap.set(
                            cachedCategoryId,
                            cachedLinks.filter((link) => !selectedLinkIds.has(link.id))
                        );
                    }
                    this.links.update((links) => links.filter((link) => !selectedLinkIds.has(link.id)));
                    if (this.selectedLink() && selectedLinkIds.has(this.selectedLink().id)) {
                        this.selectedLink.set(null);
                    }
                    this.selectedLinkIds.set(new Set());
                    this.showCategoryToast(`Links ${action === 'archive' ? 'archived' : 'deleted'} successfully.`);
                },
                error: (error: unknown) => {
                    const errorMessage = getHttpErrormessageAsString(
                        error,
                        `Failed to ${actionLabel} links. Please try again later.`
                    );
                    this.showCategoryToast(errorMessage, 7000);
                    console.error(`Failed to ${actionLabel} links`, error);
                }
            });
        });

    }

    getProfileDataForDialog() {
      const storedFirstName = localStorage.getItem('first_name') || '';
      const storedLastName = localStorage.getItem('last_name') || '';

      return {
        first_name: storedFirstName,
        last_name: storedLastName,
      };
    }

    getSettingsDataForDialog() {
      const storedDateFormat = localStorage.getItem('date_format') || '';
      const storedDateFormatSeparator = localStorage.getItem('date_format_separator') || '';

      return {
        date_format: storedDateFormat,
        date_format_separator: storedDateFormatSeparator,
      };
    }

    getUserDateFormat(): string {
      const storedDateFormat = localStorage.getItem('date_format') || 'dd-MM-yy';
      const storedDateFormatSeparator = localStorage.getItem('date_format_separator') || '-';
      let separator = '';
      switch (storedDateFormatSeparator) {
        case '2': separator = '-'; break;
        case '3': separator = '/'; break;
        default: separator = '.'; break;
      }
      switch (storedDateFormat) {
        case '2': return `MM${separator}dd${separator}yy`;
        case '3': return `yy${separator}MM${separator}dd`;
        default: return `dd${separator}MM${separator}yy`;
      }
    }

    storeProfileData(data: any) {
      localStorage.setItem('first_name', data.first_name);
      localStorage.setItem('last_name', data.last_name);
      if (data.user_info?.avatar) {
        const avatarUrl = data.user_info.avatar + '?t=' + new Date().getTime();
        localStorage.setItem('user_avatar', avatarUrl);
        this.userAvatar.set(avatarUrl);
      }
      else if (data.user_info?.avatar_deleted) {
        localStorage.removeItem('user_avatar');
        this.userAvatar.set('');
      }
    }

    storeSettingsData(data: any) {
      localStorage.setItem('date_format', data.date_format);
      localStorage.setItem('date_format_separator', data.date_format_separator);
    }

    openUserProfile() {
        const profileData = this.getProfileDataForDialog();
        const dialogRef = this.dialogService.openEdit(
            UserProfile,
            {
                title: 'Profile',
                cancelButtonText: 'Close',
                saveButtonText: 'Update',
                componentInputs: profileData,
                saveCallback: (id: number, result: any) => this.updateProfileHandler(0, result),
                customAction: (action: string, data: any) => this.handleCustomAction(action, data),
            },
            { width: '480px' },
        );

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result == null || result === false) {
                return;
            }
            if (result) {
                this.storeProfileData(result);
            }
            this.showCategoryToast('Profile updated successfully.');
        });
    }

    handleCustomAction(action: string, data: any) {
        if (action === 'updatePassword') {
            // Handle the password update action here
        }
    }

    openPasswordChange() {
        this.dialogService.open(PasswordChange, undefined, { width: '480px' });
    }

    updateProfileHandler = (id: number, result: any):Promise<any> => {
        if (result === false) {
            return Promise.resolve(false);
        }
        return firstValueFrom(this.accountService.updateProfile(result));
      }

    updateSettingsHandler = (id: number, result: any):Promise<any> => {
        if (result === false) {
            return Promise.resolve(false);
        }
        return firstValueFrom(this.accountService.updateSettings(result));
    }

    openUserSettings() {
        const settingsData = this.getSettingsDataForDialog();
        const dialogRef = this.dialogService.openEdit(
            UserSettings,
            {
                title: 'Settings',
                cancelButtonText: 'Close',
                saveButtonText: 'Done',
                componentInputs: settingsData,
                saveCallback: (id: number, result: any) => this.updateSettingsHandler(0, result),
            },
            { height: 'auto', maxHeight: '80vh' }
        );

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result == null || result === false) {
                return;
            }
            if (result) {
                this.storeSettingsData(result);
                this.dateFormat.set(this.getUserDateFormat());
            }
            this.showCategoryToast('Settings updated successfully.');
        });
    }

    onFilterClick() {}

    log(data: any) {
        console.log(data);
    }

    toggleSidebar() {
        this.isSidebarExpanded.update((val) => !val);
    }

    selectLink(link: LinkModel) {
        console.log(link);
        this.selectedLink.set(link);
        this.setSelectedCategoryForLink(link);
    }

    selectBreadcrumbCategory(categoryId: number, event: MouseEvent) {
        event.stopPropagation();
        const category = this.categoryListData().find((item) => item.id === categoryId);
        if (!category) {
            console.warn(`Category ${categoryId} from link breadcrumb was not found.`);
            return;
        }
        this.handleCategorySelection(category);
    }

    onSignOut() {
        this.authService.logout();
        this.router.navigate(['/login']);
    }

    handleCategorySelection(category: CategoryOption) {
        console.log('Clicked category captured from child tree component:', category);
        if (this.selectedCategory()?.id === category.id) {
            console.log('Category already selected, no action taken.');
            return;
        }
        clearTimeout(this.searchTimeout);
        this.searchRequest?.unsubscribe();
        this.searchQuery.set('');
        this.selectedCategory.set(category);
        if (this.selectedLink()) {
            this.selectedLink.set(null);
        }
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
                updatedLinks = currentLinks.filter((l) => l.id !== link.id);
                // update the link list in the new category
                const newCategoryUpdatedLinks = this.linksCachedMap.get(link.category_id) || [];
                newCategoryUpdatedLinks.push(link);
                this.linksCachedMap.set(link.category_id, newCategoryUpdatedLinks);
            } else {
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

    /**
     * Set the selected category when a link from the search list is clicked
     * @param { LinkModel } link
     */
    private setSelectedCategoryForLink(link: LinkModel) {
        const category = this.categoryListData().find((item) => item.id === link.category_id) ?? null;
        this.selectedCategory.set(category);
    }

    getCategoryListForDropdown(moduleId: number): CategoryOption[] {
        const moduleCategories = this.categoryListData().filter((category) => category.module_id === moduleId);
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
                    comment: item.comment,
                    price: item.price,
                    currency_id: item.currency_id || CurrencyType.RON
                },
                data: {
                    categories: this.getCategoryListForDropdown(item.category.module_id)
                },
                id: item.id,
                saveCallback: (id: number, result: Partial<LinkModel> | false) => this.saveLinkHandler(id, result, 'update')
            },
            { width: '50vw' }
        );

        dialogRef.afterClosed().subscribe((result: Partial<LinkModel> | false | undefined) => {
            if (result == null || result === false) {
                return;
            }
            this.showCategoryToast('Link updated successfully.');
        });
    }

    addLink(category?: CategoryOption | null) {
        const categoryId = category ? category.id : this.selectedCategory()?.id; // Default to 0 if no category is selected
        const categoryModuleId = category ? category.module_id : this.selectedCategory()?.module_id || 0; // Default to 0 if no category is selected
        const dialogRef = this.dialogService.openEdit(
            LinkEdit,
            {
                title: 'Add link',
                componentInputs: {
                    name: '',
                    url: '',
                    category_id: categoryId,
                    description: '',
                    comment: '',
                    price: null,
                    currency_id: CurrencyType.RON
                },
                data: {
                    categories: this.getCategoryListForDropdown(categoryModuleId)
                },
                id: 0,
                saveCallback: (id: number, result: Partial<LinkModel> | false) => this.saveLinkHandler(id, result, 'add')
            },
            { width: '480px' }
        );

        dialogRef.afterClosed().subscribe((result: Partial<LinkModel> | false | undefined) => {
            if (result == null || result === false) {
                return;
            }
            this.showCategoryToast('Link created successfully.');
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

        let response;
        if (action === 'add') {
            response = await firstValueFrom(this.linkService.createItem(data));
        } else {
            response = await firstValueFrom(this.linkService.updateItem(_id, data));
        }
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
