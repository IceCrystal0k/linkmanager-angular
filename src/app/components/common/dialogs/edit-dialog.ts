import { AfterViewInit, Component, ComponentRef, OnDestroy, Type, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogTitle, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

export interface EditDialogContent<T = unknown> {
    form?: AbstractControl;
    getSaveData?(): T | undefined;
}

export interface EditDialogData {
    title?: string;
    component: Type<unknown>;
    data?: unknown;
    componentInputs?: Record<string, unknown>;
    saveButtonText?: string;
    cancelButtonText?: string;
    id?: string;
    saveCallback?: (id: string, result: any) => Promise<any>;
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

        const editContent = this.contentComponent.instance as EditDialogContent;
        for (const [inputName, inputValue] of Object.entries(this.data.data ?? {})) {
          this.contentComponent.setInput(inputName, inputValue);
        }

        if (editContent.form) {
            const form = editContent.form as AbstractControl & {
                patchValue(value: Record<string, unknown>): void;
            };
            form.patchValue(this.data.componentInputs ?? {});
            this.isFormValid = editContent.form.valid;
            this.formStatusSubscription = editContent.form.statusChanges.subscribe(() => {
                this.isFormValid = editContent.form?.valid ?? true;
            });
        }

        this.contentComponent.changeDetectorRef.detectChanges();
    }

    ngOnDestroy(): void {
        this.formStatusSubscription?.unsubscribe();
    }

    async onSave(): Promise<void> {
        const editContent = this.contentComponent?.instance as EditDialogContent;
        const savedData = editContent?.getSaveData?.();
        const result = await this.data.saveCallback?.(this.data.id || '', savedData);
        if (result !== false) {
            this.dialogRef.close(savedData ?? true);
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }
}
