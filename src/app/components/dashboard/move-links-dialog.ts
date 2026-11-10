import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CategoryOption } from '../category/category-list';

@Component({
    imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
    selector: 'app-move-links-dialog',
    templateUrl: './move-links-dialog.html'
})
export class MoveLinksDialog {
    private fb = inject(FormBuilder);
    categories = input<CategoryOption[]>([]);

    readonly form = this.fb.nonNullable.group({
        category_id: [0, [Validators.required, Validators.min(1)]]
    });

    getSaveData(): { data: number } | false {
        return this.form.valid ? { data: this.form.controls.category_id.value } : false;
    }
}
