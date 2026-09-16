import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { HighlightedText } from '../highlighted-text';

export interface DialogData {
    title: string;
    content: string;
    cancelButtonText?: string;
    confirmButtonText?: string;
    hideCancelButton?: boolean;
}

interface DialogConfig {
    data: DialogData;
    title?: string;
}

@Component({
    imports: [HighlightedText, MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
    selector: 'app-confirm-dialog',
    styleUrl: './confirm-dialog.scss',
    templateUrl: './confirm-dialog.html'
})
export class ConfirmDialog {
    readonly dialogRef = inject(MatDialogRef<ConfirmDialog>);
    readonly dialogData = inject<DialogConfig>(MAT_DIALOG_DATA).data;
    defaultData: DialogData = {
        title: 'Confirm',
        content: 'Are you sure you want to proceed?',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm',
        hideCancelButton: false
    }
    data: DialogData = { ...this.defaultData, ...this.dialogData };

    onConfirm(): void {
        // Close the dialog, return true
        this.dialogRef.close(true);
    }

    onCancel(): void {
        // Close the dialog, return false
        this.dialogRef.close(false);
    }
}
