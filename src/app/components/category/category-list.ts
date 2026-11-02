import {
    Component,
    signal,
    input,
    output,
    inject,
    ViewChild,
    effect,
    computed,
    ElementRef,
    Injector,
    afterNextRender
} from '@angular/core';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { TooltipPosition, MatTooltipModule } from '@angular/material/tooltip';
import { CategoryMenu } from './category-menu';
import { UiDialogService } from '../../services/ui-dialog';
import { ConfirmDialog } from '../common/dialogs/confirm-dialog';
import { CategoryEdit } from './category-edit';
import { slugify } from '../../lib/string-util';
import { restoreExpandedNodes } from '../../lib/ui-util';
import { CategoryModel, CategoryService } from '../../services/category';
import { ModuleModel } from '../../services/module';
import { LinkModel, LinkService } from '../../services/link';

export interface CategoryOption {
    id: number;
    name: string;
    module_id: number;
    parent_id?: number | null;
    children?: CategoryOption[];
    parentIds?: number[];
    nameIndented?: string; // Optional property for flattened tree representation
}

interface CategoryNamePart {
    text: string;
    highlighted: boolean;
}

export interface LinkUpdatedEvent {
    link: LinkModel;
    action: 'add' | 'update' | 'delete';
}

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [MatTreeModule, MatButtonModule, MatIconModule, MatMenuModule, CategoryMenu, MatTooltipModule],
    templateUrl: './category-list.html',
    styleUrl: './category-list.scss'
})
export class CategoryList {
    private dialogService = inject(UiDialogService); // Inject the service
    private categoryService = inject(CategoryService);
    private linkService = inject(LinkService);
    private injector = inject(Injector);
    module = input<ModuleModel | null>(null);
    tooltipPosition = 'above' as TooltipPosition;

    @ViewChild('categoryTreeRef') private categoryTreeRef?: MatTree<CategoryOption>;
    @ViewChild('filterInputEl') private filterInput?: ElementRef<HTMLInputElement>;

    // Receive the sidebar expansion status from the parent dashboard
    isSidebarExpanded = input<boolean>(true);
    selectedCategoryId = input<number | null>(null);

    // Emit the selected node up to the dashboard component
    categorySelected = output<CategoryOption>();
    categoryDeselected = output<number>();
    toastMessage = output<string>();
    linkUpdated = output<LinkUpdatedEvent>();
    linkAdded = output<CategoryOption | null>();

    selectedItem = signal<CategoryOption | null>(null);
    isFilterInputVisible = signal<boolean>(false);
    filterText = signal<string>('');
    isModuleCategoriesExpanded = signal(true);

    // Tree category structure
    categoryTreeData = input<CategoryOption[]>([]);
    categoryListData = input<CategoryOption[]>([]);
    categoryTree = computed(() => {
        const moduleCategories = this.categoryTreeData().filter((category) => category.module_id === this.module()?.id);
        const query = this.filterText().trim();

        if (query.length < 2) {
            return moduleCategories;
        }

        return moduleCategories
            .map((category) => this.filterCategory(category, query))
            .filter((category): category is CategoryOption => category !== null);
    });
    private expandedNodeIds = new Set<number>();

    private restoreModuleExpansionOnFilter = effect(() => {
        const isFiltering = this.filterText().trim().length >= 2;
        if (isFiltering && !this.isModuleCategoriesExpanded()) {
            this.isModuleCategoriesExpanded.set(true);
        }
    });

    private restoreExpansionOnDataChange = effect(() => {
        const treeData = this.categoryTree();
        const isFiltering = this.filterText().trim().length >= 2;

        afterNextRender(
            () => {
                const tree = this.categoryTreeRef;
                if (!tree) {
                    return;
                }

                if (isFiltering) {
                    this.expandFilteredAncestors(treeData, tree);
                } else {
                    restoreExpandedNodes(treeData, this.expandedNodeIds, tree);
                }
            },
            { injector: this.injector }
        );
    });

    private expandSelectedCategory = effect(() => {
        const selectedId = this.selectedCategoryId();
        const moduleId = this.module()?.id;
        if (selectedId == null || moduleId == null) {
            return;
        }

        const moduleCategories = this.categoryTreeData().filter((category) => category.module_id === moduleId);
        const path = this.findCategoryPath(moduleCategories, selectedId);
        if (!path) {
            return;
        }

        this.isModuleCategoriesExpanded.set(true);
        if (!this.findCategoryPath(this.categoryTree(), selectedId)) {
            this.filterText.set('');
        }

        afterNextRender(
            () => {
                const tree = this.categoryTreeRef;
                if (!tree) {
                    return;
                }

                for (const ancestor of path.slice(0, -1)) {
                    this.expandedNodeIds.add(ancestor.id);
                    tree.expand(ancestor);
                }
            },
            { injector: this.injector }
        );
    });

    // Material Tree Accessors
    childrenAccessor = (node: CategoryOption) => node.children ?? [];
    hasChild = (_: number, node: CategoryOption) => !!node.children && node.children.length > 0;

    private filterCategory(category: CategoryOption, query: string): CategoryOption | null {
        const children = (category.children ?? [])
            .map((child) => this.filterCategory(child, query))
            .filter((child): child is CategoryOption => child !== null);
        const matches = category.name.toLocaleLowerCase().includes(query.toLocaleLowerCase());

        if (!matches && children.length === 0) {
            return null;
        }

        return { ...category, children };
    }

    private expandFilteredAncestors(nodes: CategoryOption[], tree: MatTree<CategoryOption>): void {
        for (const node of nodes) {
            if (node.children?.length) {
                tree.expand(node);
                this.expandFilteredAncestors(node.children, tree);
            }
        }
    }

    private findCategoryPath(categories: CategoryOption[], categoryId: number): CategoryOption[] | null {
        for (const category of categories) {
            if (category.id === categoryId) {
                return [category];
            }

            const childPath = this.findCategoryPath(category.children ?? [], categoryId);
            if (childPath) {
                return [category, ...childPath];
            }
        }

        return null;
    }

    getCategoryNameParts(name: string): CategoryNamePart[] {
        const query = this.filterText().trim();
        if (query.length < 2) {
            return [{ text: name, highlighted: false }];
        }

        const parts: CategoryNamePart[] = [];
        const lowerName = name.toLocaleLowerCase();
        const lowerQuery = query.toLocaleLowerCase();
        let lastIndex = 0;
        let matchIndex = lowerName.indexOf(lowerQuery);

        while (matchIndex !== -1) {
            if (matchIndex > lastIndex) {
                parts.push({ text: name.slice(lastIndex, matchIndex), highlighted: false });
            }
            parts.push({ text: name.slice(matchIndex, matchIndex + query.length), highlighted: true });
            lastIndex = matchIndex + query.length;
            matchIndex = lowerName.indexOf(lowerQuery, lastIndex);
        }

        if (lastIndex < name.length) {
            parts.push({ text: name.slice(lastIndex), highlighted: false });
        }

        return parts;
    }

    hideCategoryActions() {
        // Remove 'active-menu' class from all buttons when the menu is closed
        document.querySelectorAll('app-category-list .active-menu').forEach((el) => el.classList.remove('active-menu'));
    }

    showCategoryActions(node: CategoryOption, event: MouseEvent) {
        // Implement the logic to show category actions (e.g., edit, delete)
        this.selectedItem.set(node);
        this.hideCategoryActions();
        const target = event.currentTarget as HTMLElement;
        target.classList.add('active-menu'); // Add 'active' class to the clicked button
        console.log('Show actions for category:', node);
    }

    getCategoryTree(): MatTree<CategoryOption> | undefined {
        return this.categoryTreeRef;
    }

    onCategoryMenuClosed() {
        console.log('Menu closed from the category list component');
        this.hideCategoryActions();
    }

    closeCategoryActions() {
        console.log('Menu closed from the category list component 2');
    }

    toggleCategory(node: CategoryOption) {
        console.log('Toggling category:', node);
        if (node.id && this.categoryTreeRef?.isExpanded(node)) {
            this.expandedNodeIds.delete(node.id);
        } else if (node.id) {
            this.expandedNodeIds.add(node.id);
        }

        this.categoryTreeRef?.toggle(node);
    }

    toggleModuleCategories(event: MouseEvent) {
        event.stopPropagation();
        if (this.filterText().trim().length < 2) {
            this.isModuleCategoriesExpanded.update((expanded) => !expanded);
        }
    }

    getCategoryListForDropdown(excludeId: number | null = null): CategoryOption[] {
        const moduleCategories = this.categoryListData().filter((category) => {
            const isSameModule = category.module_id === this.module()?.id;
            const isNotExcluded = excludeId ? category.id !== excludeId : true;
            const isNotDescendant = category.parentIds && excludeId ? !category.parentIds.includes(excludeId) : true;
            return isSameModule && isNotExcluded && isNotDescendant;
        });
        return moduleCategories;
    }

    editCategory(item: CategoryOption | null) {
        if (!item) {
            console.warn('No category selected for editing.');
            return;
        }
        // Implement the logic to edit the category with the given nodeId
        console.log('Edit category with ID:', item.id);
        const dialogData = {
            title: 'Edit Category',
            componentInputs: {
                name: item.name ?? '',
                parent_id: item.parent_id ?? '',
                slug: item.name ? slugify(item.name || '') : '',
                id: item.id ?? 0,
                module_id: item.module_id ?? 0
            },
            data: {
                moduleId: item?.module_id ?? this.module()?.id ?? 0,
                categories: this.getCategoryListForDropdown(item.id) // Pass the flattened category list for dropdown
            },
            saveCallback: (id: number, result: CategoryModel) => this.saveHandler(id, result),
            id: item.id
        };
        const dialogRef = this.dialogService.openEdit(CategoryEdit, dialogData, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result == null || result === false) {
                console.log('Save cancelled for category:', item.id);
                return;
            }

            if (item.children) {
                result.children = item.children; // Preserve children if they exist
            }
            console.log('Save confirmed for category:', item.id, 'Result:', result);
            if (result.parent_id != null && item.parent_id !== result.parent_id && !this.expandedNodeIds.has(result.parent_id)) {
                this.expandedNodeIds.add(result.parent_id);
            }
            this.toastMessage.emit('Category updated successfully.');
        });
    }

    deleteCategory(item: CategoryOption | null) {
        if (!item) {
            console.warn('No category selected for deletion.');
            return;
        }

        // Implement the logic to delete the category with the given nodeId
        console.log('Delete category with ID:', item.id);
        const dialogData = {
            title: 'Confirm Deletion',
            content: `Are you sure you want to delete the category **${item.name ?? ''}**? All the subcategories and links under this category will also be deleted.`
        };
        const dialogRef = this.dialogService.open(ConfirmDialog, dialogData, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
            if (confirmed && item.id) {
                this.categoryService.deleteItem(item.id).subscribe({
                    next: () => {
                        console.log('Category deleted:', item.id);
                        this.toastMessage.emit('Category deleted successfully.');
                        this.categoryDeselected.emit(item.id);
                    },
                    error: (error: unknown) => {
                        console.error('Failed to delete category', error);
                        this.toastMessage.emit('Failed to delete category.');
                    }
                });
                return;
            }

            console.log('Delete cancelled for category:', item.id);
        });
    }

    addCategory(item: CategoryOption | null, event?: MouseEvent) {
        // Implement the logic to add a subfolder to the category with the given nodeId
        console.log('Add subfolder to category with ID:', item?.id);
        event?.stopPropagation(); // Prevent the click from propagating to the parent
        const dialogData = {
            title: 'Create category',
            componentInputs: {
                name: '',
                parent_id: item?.id ?? '',
                slug: '',
                id: 0,
                module_id: item?.module_id ?? this.module()?.id ?? 0
            },
            data: {
                moduleId: item?.module_id ?? this.module()?.id ?? 0,
                categories: this.getCategoryListForDropdown() // Pass the flattened category list for dropdown
            },
            id: 0, // New category, so id is 0
            saveCallback: (id: number, result: CategoryModel) => this.saveHandler(id, result)
        };
        const dialogRef = this.dialogService.openEdit(CategoryEdit, dialogData, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result == null || result === false) {
                console.log('Create cancelled for category');
                return;
            }

            console.log('Create confirmed for category:', item?.name, 'Result:', result);
            const expandId = item?.id ?? result.parent_id;
            if (expandId && !this.expandedNodeIds.has(expandId)) {
                this.expandedNodeIds.add(expandId);
            }
            this.toastMessage.emit('Category created successfully.');
        });
    }

    async saveHandler(id: number, data: CategoryModel): Promise<CategoryModel | false> {
        return new Promise<CategoryModel | false>((resolve, reject) => {
            if (id) {
                this.categoryService.updateItem(id, data).subscribe({
                    next: (response) => {
                        // Success callback
                        console.log('Category updated successful!', response);
                        resolve(response.data);
                    },
                    error: (err) => {
                        // Error callback (handles 401, 500, network issues, etc.)
                        console.error('Failed to update category', err);
                        reject(err);
                    }
                });
            } else {
                this.categoryService.createItem(data).subscribe({
                    next: (response: any) => {
                        // Success callback
                        console.log('Category created successful!', response);
                        resolve(response.data);
                    },
                    error: (err) => {
                        // Error callback (handles 401, 500, network issues, etc.)
                        console.error('Failed to create category', err);
                        reject(err);
                    }
                });
            }
        });
    }

    addLink(item: CategoryOption | null) {
        this.linkAdded.emit(item);
        return;
    }

    onCategorySelect(node: CategoryOption, tree: MatTree<CategoryOption>, event: MouseEvent) {
        this.categorySelected.emit(node); // Notify parent component
        event.stopPropagation();
    }

    showFilterInput() {
        if (!this.isFilterInputVisible()) {
            this.isFilterInputVisible.set(true);
            afterNextRender(() => this.filterInput?.nativeElement.focus(), {
                injector: this.injector
            });
        }
    }

    clearFilter(event?: MouseEvent) {
        event?.stopPropagation(); // Prevent the click from propagating to the parent
        this.filterText.set('');
        this.isFilterInputVisible.set(false);
    }

    onFilterTextChange(event: Event): void {
        this.filterText.set((event.target as HTMLInputElement).value);
    }
}
