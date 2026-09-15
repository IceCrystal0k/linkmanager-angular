import { ComponentType } from '@angular/cdk/overlay';
import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GenericDialog } from '../components/common/generic-dialog/generic-dialog';

@Injectable({
    providedIn: 'root'
})
export class UiDialogService {
    constructor(private dialog: MatDialog) {}
    open<T>(component: ComponentType<unknown>, data?: unknown, title?: string) {
        return this.dialog.open(GenericDialog, {
            width: '500px',
            data: {
                component,
                data,
                title
            }
        });
    }
}
