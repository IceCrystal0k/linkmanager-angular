import { ComponentType } from '@angular/cdk/overlay';
import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

@Injectable({
    providedIn: 'root'
})
export class UiDialogService {
    readonly dialog = inject(MatDialog);
    open<T>(component: ComponentType<unknown>, data?: unknown, title?: string) {
        return this.dialog.open(component, {
            width: '500px',
            data: {
                component,
                data,
                title
            }
        });
    }
}
