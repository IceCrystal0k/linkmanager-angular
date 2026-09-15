import { Component, input, output, ViewChild, InputSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { CategoryNode } from './category-list';

@Component({
    selector: 'app-category-menu',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatMenuModule],
    templateUrl: './category-menu.html',
    styleUrl: './category-menu.scss'
})
export class CategoryMenu {
    @ViewChild(MatMenu)
    readonly menu!: MatMenu;
    menuClosed = output<boolean>();
    onEdit = output<CategoryNode | null>();
    onDelete = output<CategoryNode | null>();
    onAddSubfolder = output<CategoryNode | null>();

    selectedItem = input<CategoryNode | null>(null);
    editItem(item: InputSignal<CategoryNode | null>) {
        // Implement the logic to edit the category with the given nodeId
        console.log('Edit category with ID:', item()?.id);
        this.onEdit.emit(item());
    }

    deleteItem(item: InputSignal<CategoryNode | null>) {
        // Implement the logic to delete the category with the given nodeId
        console.log('Delete category with ID:', item()?.id);
        this.onDelete.emit(item());
    }

    addSubfolder(item: InputSignal<CategoryNode | null>) {
        // Implement the logic to add a subfolder to the category with the given nodeId
        console.log('Add subfolder to category with ID:', item()?.id);
        this.onAddSubfolder.emit(item());
    }

    onMenuClosed() {
        this.menuClosed.emit(true);
    }
}
