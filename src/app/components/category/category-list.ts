import { Component, signal, input, output } from '@angular/core';
import { MatTree, MatTreeModule } from '@angular/material/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface CategoryNode {
    name: string;
    id?: string;
    children?: CategoryNode[];
}

@Component({
    selector: 'app-category-list',
    standalone: true,
    imports: [MatTreeModule, MatButtonModule, MatIconModule],
    templateUrl: './category-list.html',
    styleUrl: './category-list.scss'
})
export class CategoryList {
    // Receive the sidebar expansion status from the parent dashboard
    isSidebarExpanded = input<boolean>(true);

    // Emit the selected node up to the dashboard component
    categorySelected = output<CategoryNode>();

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

    onCategorySelect(node: CategoryNode, tree: MatTree<CategoryNode>, event: MouseEvent) {
        if ((event.target as any)?.nodeName === 'MAT-ICON') {
            event.stopPropagation();
            tree && tree.toggle(node);
            return;
        }
        this.categorySelected.emit(node); // Notify parent component
    }
}
