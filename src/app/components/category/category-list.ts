import { Component, signal, input, output, inject, ViewChild } from '@angular/core';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CategoryMenu } from './category-menu';
import { UiDialogService } from '../../services/ui-dialog';
import { ConfirmDialog } from '../common/dialogs/confirm-dialog';
import { CategoryEdit } from './category-edit';
import { slugify } from '../../lib/string-util';
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

    @ViewChild('categoryTree') private categoryTree?: MatTree<CategoryNode>;

    // Receive the sidebar expansion status from the parent dashboard
    isSidebarExpanded = input<boolean>(true);

    // Emit the selected node up to the dashboard component
    categorySelected = output<CategoryNode>();

    selectedItem = signal<CategoryNode | null>(null);

    // Tree category structure
    categoryListData = input<CategoryNode[]>([]);

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

    onCategoryMenuClosed() {
      console.log('Menu closed from the category list component');
      this.hideCategoryActions();
    }

    closeCategoryActions() {
        console.log('Menu closed from the category list component 2');
    }

    editCategory(item: CategoryNode | null) {
        // Implement the logic to edit the category with the given nodeId
        console.log('Edit category with ID:', item?.id);
        const dialogData = {
          title: 'Edit Category',
          componentInputs: {
            name: item?.name ?? '',
            parent_id: item?.parent_id ?? '',
            slug: item?.name ? slugify(item?.name || '') : '',
            id: item?.id ?? 0
          },
          id: item?.id,
        }
        const dialogRef = this.dialogService.openEdit(
          CategoryEdit,
          dialogData,
          {
            width: '400px',
          }
        );

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result !== false) {
                console.log('Save confirmed for category:', item?.id, 'Result:', result);
                return;
            }

            console.log('Save cancelled for category:', item?.id);
        });
    }

    deleteCategory(item: CategoryNode | null) {
        // Implement the logic to delete the category with the given nodeId
        console.log('Delete category with ID:', item?.id);
        const dialogData = {
          title: 'Confirm Deletion',
                    content: `Are you sure you want to delete the category **${item?.name ?? ''}**? All the subcategories and links under this category will also be deleted.`,
        }
        const dialogRef = this.dialogService.open(
          ConfirmDialog,
          dialogData,
          {
            width: '400px',
          }
        );

        dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
          if (confirmed && item?.id) {
            const expandedNodeIds = this.getExpandedNodeIds(this.categoryListData());
            this.categoryService.deleteCategory(item.id);
            // .subscribe(() => {
            //     console.log('Category deleted:', item?.id);
            // });

            // The service replaces ancestor objects while removing the node.
            // Restore expansion after the tree has rendered those new objects.
            setTimeout(() => this.restoreExpandedNodes(expandedNodeIds));
                return;
            }

            console.log('Delete cancelled for category:', item?.id);
        });
    }

      private getExpandedNodeIds(nodes: CategoryNode[]): Set<string> {
        const expandedNodeIds = new Set<string>();

        const collectExpandedNodes = (currentNodes: CategoryNode[]) => {
          for (const node of currentNodes) {
            if (node.id && this.categoryTree?.isExpanded(node)) {
              expandedNodeIds.add(node.id);
            }

            if (node.children) {
              collectExpandedNodes(node.children);
            }
          }
        };

        collectExpandedNodes(nodes);
        return expandedNodeIds;
      }

      private restoreExpandedNodes(expandedNodeIds: Set<string>) {
        if (!this.categoryTree) {
          return;
        }

        const expandMatchingNodes = (nodes: CategoryNode[]) => {
          for (const node of nodes) {
            if (node.id && expandedNodeIds.has(node.id)) {
              this.categoryTree?.expand(node);
            }

            if (node.children) {
              expandMatchingNodes(node.children);
            }
          }
        };

        expandMatchingNodes(this.categoryListData());
      }

    addSubfolder(item: CategoryNode | null) {
        // Implement the logic to add a subfolder to the category with the given nodeId
        console.log('Add subfolder to category with ID:', item?.id);
        const dialogData = {
          title: 'Create category',
          componentInputs: {
            name: '',
            parent_id: item?.id ?? '',
            slug: '',
            id: 0
          },
          id: null,
        }
        const dialogRef = this.dialogService.openEdit(
          CategoryEdit,
          dialogData,
          {
            width: '400px',
          }
        );

        dialogRef.afterClosed().subscribe((result: any | undefined) => {
            if (result !== false) {
                console.log('Create confirmed for category:', item?.name, 'Result:', result);
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
