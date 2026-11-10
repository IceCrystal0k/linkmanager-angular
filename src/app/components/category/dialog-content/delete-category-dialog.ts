import { Component, inject, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { CategoryOption } from '../category-list';

@Component({
    imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule, MatRadioModule],
    selector: 'app-delete-category-dialog',
    templateUrl: './delete-category-dialog.html',
    styleUrl: './delete-category-dialog.scss'
})
export class DeleteCategoryDialog {
    private fb = inject(FormBuilder);
    categories = input<CategoryOption[]>([]);

    readonly form = this.fb.nonNullable.group({
        category_id: [0, [Validators.required, Validators.min(1)]],
        action: ['move', [Validators.required]] // Default action is 'move'
    });

    constructor() {
        this.form.controls.action.valueChanges.subscribe((action) => {
            const categoryId = this.form.controls.category_id;
            categoryId.setValidators(action === 'move' ? [Validators.required, Validators.min(1)] : []);
            categoryId.updateValueAndValidity();
        });
    }

    getSaveData(): { data: number } | false {
      const action = this.form.controls.action.value;
      if (action === 'delete') {
          return { data: 0 }; // Return 0 to indicate deletion
      }
      return this.form.valid ? { data: this.form.controls.category_id.value } : false;
    }
}
