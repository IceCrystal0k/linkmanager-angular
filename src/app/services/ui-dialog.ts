import { ComponentType } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EditDialog, EditDialogData } from '../components/common/dialogs/edit-dialog';

export interface DialogConfig {
    width?: string;
    height?: string;
}
@Injectable({
    providedIn: 'root'
})
export class UiDialogService {
    readonly dialog = inject(MatDialog);
    open<T>(component: ComponentType<unknown>, data?: unknown, dialogConfig?: any) {
        const defaultConfig: DialogConfig = {
            width: '500px'
        };
        const config: any = { ...defaultConfig, ...dialogConfig };
        return this.dialog.open(component, {
            ...config,
            data: {
                component,
                data
            }
        });
    }

    openEdit(component: ComponentType<unknown>, editData?: Omit<EditDialogData, 'component'>, dialogConfig?: any) {
        return this.open(
            EditDialog,
            { component, ...editData },
            {
                width: '480px',
                height: '100vh',
                maxWidth: '100vw',
                maxHeight: '100vh',
                position: { right: '0' },
                panelClass: 'edit-dialog-panel',
                ...dialogConfig
            }
        );
    }
}
