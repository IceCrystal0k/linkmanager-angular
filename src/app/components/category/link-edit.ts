import { Component, inject, input, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgxEditorComponent, NgxEditorMenuComponent, Editor } from 'ngx-editor';
import { LinkModel } from '../../services/link';
import { CurrencyService } from '../../services/currency';
import { CategoryOption } from './category-list';


@Component({
    imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, NgxEditorComponent, NgxEditorMenuComponent],
    selector: 'app-link-edit',
    templateUrl: './link-edit.html'
})
export class LinkEdit implements OnDestroy {
    private fb = inject(FormBuilder);
    categories = input<CategoryOption[]>([]);
    readonly editor = new Editor();
    currencies = inject(CurrencyService).getCurrencyList();

    linkForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        url: ['', [Validators.required, Validators.maxLength(2048)]],
        category_id: [0, [Validators.required, Validators.min(1)]],
        description: ['', Validators.maxLength(255)],
        comment: ['', Validators.maxLength(4194303)],
        price: [undefined, Validators.maxLength(10)],
        currency_id: [undefined, Validators.maxLength(3)]
    });

    readonly form = this.linkForm;

    ngOnDestroy(): void {
        this.editor.destroy();
    }

    getSaveData(): Partial<LinkModel> | false {
        if (!this.linkForm.valid) {
            return false;
        }

        return this.linkForm.getRawValue();
    }
}
