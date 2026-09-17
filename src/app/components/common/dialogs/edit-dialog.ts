import { AfterViewInit, Component, ComponentRef, OnDestroy, Type, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

export interface EditDialogContent<T = unknown> {
    form?: AbstractControl;
    save?(): T | undefined;
}

export interface EditDialogData {
    title?: string;
    component: Type<unknown>;
    data?: unknown;
    componentInputs?: Record<string, unknown>;
    saveButtonText?: string;
    cancelButtonText?: string;
}

interface DialogConfig {
    data: EditDialogData;
}

@Component({
    imports: [MatButtonModule, MatDialogActions, MatDialogTitle, MatDialogContent],
    selector: 'app-edit-dialog',
    styleUrl: './edit-dialog.scss',
    templateUrl: './edit-dialog.html'
})
export class EditDialog implements AfterViewInit, OnDestroy {
    private readonly dialogRef = inject(MatDialogRef<EditDialog>);
    private readonly dialogData = inject<DialogConfig>(MAT_DIALOG_DATA).data;

    @ViewChild('content', { read: ViewContainerRef, static: true })
    private readonly content!: ViewContainerRef;

    private contentComponent?: ComponentRef<unknown>;
    private formStatusSubscription?: Subscription;

    isFormValid = true;

    readonly data = {
        title: 'Edit',
        cancelButtonText: 'Cancel',
        saveButtonText: 'Save',
        ...this.dialogData
    };

    ngAfterViewInit(): void {
        this.contentComponent = this.content.createComponent(this.data.component);

        for (const [inputName, inputValue] of Object.entries(this.data.componentInputs ?? {})) {
            this.contentComponent.setInput(inputName, inputValue);
        }

        const editContent = this.contentComponent.instance as EditDialogContent;
        if (editContent.form) {
            this.isFormValid = editContent.form.valid;
            this.formStatusSubscription = editContent.form.statusChanges.subscribe(() => {
                this.isFormValid = editContent.form?.valid ?? true;
            });
        }
    }

    ngOnDestroy(): void {
        this.formStatusSubscription?.unsubscribe();
    }

    onSave(): void {
        const editContent = this.contentComponent?.instance as EditDialogContent;
        const savedData = editContent?.save?.();
        this.dialogRef.close(savedData ?? this.data.data ?? true);
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
