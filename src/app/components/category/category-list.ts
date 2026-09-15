import { Component, signal, input, output, inject } from '@angular/core';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CategoryMenu } from './category-menu';
import { UiDialogService } from '../../services/ui-dialog';
import { DeleteCategoryDialog } from './dialog-content/delete-category-dialog';

export interface CategoryNode {
    name: string;
    id?: string;
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

    // Receive the sidebar expansion status from the parent dashboard
    isSidebarExpanded = input<boolean>(true);

    // Emit the selected node up to the dashboard component
    categorySelected = output<CategoryNode>();

    selectedItem = signal<CategoryNode | null>(null);

    // Tree category structure
    categoryListData = signal<CategoryNode[]>([
        {
            name: 'Work',
            id: 'work',
            children: [
                { name: 'Projects', id: 'work-projects' },
                { name: 'Credentials', id: 'work-credentials' },
                { name: 'Documentation', id: 'work-docs' }
            ]
        },
        {
            name: 'Personal',
            id: 'personal',
            children: [
                {
                    name: 'Finance',
                    id: 'pers-finance',
                    children: [
                        {
                            name: 'Green',
                            id: 'pers-finance-green',
                            children: [
                                { name: 'Broccoli', id: 'pers-finance-green-brocoli' },
                                { name: 'Brussels sprouts', id: 'pers-finance-green-bussels-sprouts' }
                            ]
                        },
                        {
                            name: 'Orange',
                            id: 'pers-finance-orange',
                            children: [
                                { name: 'Pumpkins', id: 'pers-finance-orange-pumpkin' },
                                { name: 'Carrots', id: 'pers-finance-orange-carrots' }
                            ]
                        }
                    ]
                },
                {
                    name: 'Shopping',
                    id: 'pers-shopping',
                    children: [
                        {
                            name: 'Green',
                            id: 'pers-shopping-green',
                            children: [
                                { name: 'Broccoli', id: 'shopping-green-brocoli' },
                                { name: 'Brussels sprouts', id: 'shopping-green-bussels-sprouts' }
                            ]
                        },
                        {
                            name: 'Orange',
                            id: 'pers-shopping-orange',
                            children: [
                                { name: 'Pumpkins', id: 'shopping-orange-pumpkin' },
                                { name: 'Carrots', id: 'shopping-orange-carrots' }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: 'Entertainment',
            id: 'entertainment'
        }
    ]);

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
        console.log(event.currentTarget);
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
    }

    deleteCategory(item: CategoryNode | null) {
        // Implement the logic to delete the category with the given nodeId
        console.log('Delete category with ID:', item?.id);
        const dialogRef = this.dialogService.open(
          DeleteCategoryDialog,
          item,
          'Delete category'
        );

        dialogRef.afterClosed().subscribe((confirmed: boolean | undefined) => {
            if (confirmed) {
                console.log('Delete confirmed for category:', item?.id);
                return;
            }

            console.log('Delete cancelled for category:', item?.id);
        });
    }

    addSubfolder(item: CategoryNode | null) {
        // Implement the logic to add a subfolder to the category with the given nodeId
        console.log('Add subfolder to category with ID:', item?.id);
    }

    onCategorySelect(node: CategoryNode, tree: MatTree<CategoryNode>, event: MouseEvent) {
        this.categorySelected.emit(node); // Notify parent component
        event.stopPropagation();
    }
}
