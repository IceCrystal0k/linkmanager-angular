import { Component, signal, input, output, inject, ViewChild, effect } from '@angular/core';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CategoryMenu } from './category-menu';
import { UiDialogService } from '../../services/ui-dialog';
import { ConfirmDialog } from '../common/dialogs/confirm-dialog';
import { CategoryEdit } from './category-edit';
import { slugify } from '../../lib/string-util';
import { getExpandedNodeIds, restoreExpandedNodes } from '../../lib/ui-util';
import { CategoryService } from '../../services/category';

export interface CategoryNode {
    name: string;
    id?: string;
    parent_id?: string | null;
    slug?: string;
    module_id?: string;
    children?: CategoryNode[];
}

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [MatTreeModule, MatButtonModule, MatIconModule, MatMenuModule, CategoryMenu],
    templateUrl: './category-list.html',
    styleUrl: './category-list.scss'
})
export class CategoryList {
    private dialogService = inject(UiDialogService); // Inject the service
    private categoryService = inject(CategoryService);
    moduleId = input<string | null>(null);

    @ViewChild('categoryTree') private categoryTree?: MatTree<CategoryNode>;

    // Receive the sidebar expansion status from the parent dashboard
    isSidebarExpanded = input<boolean>(true);

    // Emit the selected node up to the dashboard component
    categorySelected = output<CategoryNode>();

    selectedItem = signal<CategoryNode | null>(null);

    // Tree category structure
    categoryListData = input<CategoryNode[]>([]);
    private expandedNodeIds = new Set<string>();

    // Effect to restore expanded nodes when categoryListData changes
    private restoreExpansionOnDataChange = effect(() => {
        this.categoryListData();
        setTimeout(() => restoreExpandedNodes(this.categoryListData(), this.expandedNodeIds, this.categoryTree));
    });

    // Material Tree Accessors
    childrenAccessor = (node: CategoryNode) => node.children ?? [];
    hasChild = (_: number, node: CategoryNode) => !!node.children && node.children.length > 0;

    hideCategoryActions() {
        // Remove 'active-menu' class from all buttons when the menu is closed
        document.querySelectorAll('app-category-list .active-menu').forEach((el) => el.classList.remove('active-menu'));
    }

    showCategoryActions(node: CategoryNode, event: MouseEvent) {
        // Implement the logic to show category actions (e.g., edit, delete)
        this.selectedItem.set(node);
        this.hideCategoryActions();
        const target = event.currentTarget as HTMLElement;
        target.classList.add('active-menu'); // Add 'active' class to the clicked button
        console.log('Show actions for category:', node);
    }

    getCategoryTree(): MatTree<CategoryNode> | undefined {
        return this.categoryTree;
    }

    onCategoryMenuClosed() {
        console.log('Menu closed from the category list component');
        this.hideCategoryActions();
    }

    closeCategoryActions() {
        console.log('Menu closed from the category list component 2');
    }

    toggleCategory(node: CategoryNode) {
      console.log('Toggling category:', node);
        if (node.id && this.categoryTree?.isExpanded(node)) {
            this.expandedNodeIds.delete(node.id);
        } else if (node.id) {
            this.expandedNodeIds.add(node.id);
        }

        this.categoryTree?.toggle(node);
    }

    editCategory(item: CategoryNode | null) {
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
                module_id: item.module_id ?? '',
            },
            data: {
              moduleId: item?.module_id ?? this.moduleId() ?? ''
            },
            id: item.id
        };
        const dialogRef = this.dialogService.openEdit(CategoryEdit, dialogData, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result !== false) {
                console.log('Save confirmed for category:', item.id, 'Result:', result);
                // const expandedNodeIds = getExpandedNodeIds(this.categoryListData(), this.categoryTree);
                if (item?.parent_id !== result.parent_id && !this.expandedNodeIds.has(result.parent_id)) {
                    this.expandedNodeIds.add(result.parent_id);
                }
                this.categoryService.updateItem(item.id || '', result);

                // this.categoryService.updateItem(result).subscribe({
                //     next: (response) => {
                //         // Success callback
                //         console.log('Category updated successful!', response);
                //         // close the dialog
                //         // this.dialog.close();
                //     },
                //     error: (err) => {
                //         // Error callback (handles 401, 500, network issues, etc.)
                //         console.error('Failed to update category', err);
                //         this.errorMessage.set(err.error?.errors?.join('<br/>') || 'Error saving category.');
                //     }
                // });

                // The service replaces ancestor objects while removing the node.
                // Restore expansion after the tree has rendered those new objects.
                // setTimeout(() => restoreExpandedNodes(this.categoryListData(), this.expandedNodeIds, this.categoryTree));
                return;
            }

            console.log('Save cancelled for category:', item.id);
        });
    }

    deleteCategory(item: CategoryNode | null) {
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
                const expandedNodeIds = getExpandedNodeIds(this.categoryListData(), this.categoryTree);
                this.categoryService.deleteItem(item.id);
                // .subscribe(() => {
                //     console.log('Category deleted:', item?.id);
                // });

                // The service replaces ancestor objects while removing the node.
                // Restore expansion after the tree has rendered those new objects.
                // setTimeout(() => restoreExpandedNodes(this.categoryListData(), this.expandedNodeIds, this.categoryTree));
                return;
            }

            console.log('Delete cancelled for category:', item.id);
        });
    }

    addCategory(item: CategoryNode | null) {
        // Implement the logic to add a subfolder to the category with the given nodeId
        console.log('Add subfolder to category with ID:', item?.id);
        const dialogData = {
            title: 'Create category',
            componentInputs: {
                name: '',
                parent_id: item?.id ?? '',
                slug: '',
                id: 0,
                module_id: item?.module_id ?? this.moduleId() ?? '',
            },
            data: {
              moduleId: item?.module_id ?? this.moduleId() ?? ''
            },
            id: null
        };
        const dialogRef = this.dialogService.openEdit(CategoryEdit, dialogData, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result !== false) {
                console.log('Create confirmed for category:', item?.name, 'Result:', result);
                // const expandedNodeIds = getExpandedNodeIds(this.categoryListData(), this.categoryTree);
                // If the parent node was not expanded before, expand it after adding the new category
                if (item?.id && !this.expandedNodeIds.has(item.id)) {
                    this.expandedNodeIds.add(item.id);
                }
                this.categoryService.createItem(result);
                // this.categoryService.createItem(result).subscribe({
                //     next: (response) => {
                //         // Success callback
                //         console.log('Category created successful!', response);
                //         // close the dialog
                //         // this.dialog.close();
                //     },
                //     error: (err) => {
                //         // Error callback (handles 401, 500, network issues, etc.)
                //         console.error('Failed to create category', err);
                //         this.errorMessage.set(err.error?.errors?.join('<br/>') || 'Error saving category.');
                //     }
                // });

                // The service replaces ancestor objects while removing the node.
                // Restore expansion after the tree has rendered those new objects.
                // setTimeout(() => restoreExpandedNodes(this.categoryListData(), this.expandedNodeIds, this.categoryTree));
                return;
            }

            console.log('Create cancelled for category');
        });
    }

    onCategorySelect(node: CategoryNode, tree: MatTree<CategoryNode>, event: MouseEvent) {
        this.categorySelected.emit(node); // Notify parent component
        event.stopPropagation();
    }
}
