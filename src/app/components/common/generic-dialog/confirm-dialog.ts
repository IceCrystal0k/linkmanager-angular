import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
    title: string;
    content: string | Component;
    cancelButtonText?: string;
    confirmButtonText?: string;
    showCancelButton?: boolean;
}

@Component({
    imports: [MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
    selector: 'app-confirm-dialog',
    styleUrl: './confirm-dialog.scss',
    templateUrl: './confirm-dialog.html'
})
export class ConfirmDialog {
    readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
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
