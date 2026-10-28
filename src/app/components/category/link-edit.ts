import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LinkModel } from '../../services/link';
import { CategoryOption } from './category-list';

@Component({
    imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
    selector: 'app-link-edit',
    templateUrl: './link-edit.html'
})
export class LinkEdit {
    private fb = inject(FormBuilder);
    categories = input<CategoryOption[]>([]);

    linkForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        url: ['', [Validators.required, Validators.maxLength(2048)]],
        category_id: [0, [Validators.required, Validators.min(1)]],
        description: ['', Validators.maxLength(255)],
        comment: ['', Validators.maxLength(4000)]
    });

    readonly form = this.linkForm;

    getSaveData(): Partial<LinkModel> | false {
        if (!this.linkForm.valid) {
            return false;
        }

        return this.linkForm.getRawValue();
    }
}
