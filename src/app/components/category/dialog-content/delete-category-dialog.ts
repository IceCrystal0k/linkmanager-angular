import { Component, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogTitle,
  MatDialogRef
} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';

export interface DialogData {
  data: {
    id: string;
    name: string;
  };
  title: string;
}


@Component({
    imports: [MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
    selector: 'app-delete-category-content',
    styleUrl: './delete-category-content.scss',
    templateUrl: './delete-category-content.html'
})
export class DeleteCategoryDialog {
  readonly dialogRef = inject(MatDialogRef<DeleteCategoryDialog>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  onConfirm(): void {
    // Close the dialog, return true
    this.dialogRef.close(true);
  }

  onCancel(): void {
    // Close the dialog, return false
    this.dialogRef.close(false);
  }
}
