import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService } from '../../services/category';

interface CategoryOption {
    name: string;
    id: string;
    parent_id?: string | null;
    children?: CategoryOption[];
}

@Component({
    imports: [ReactiveFormsModule, MatFormFieldModule, MatSelectModule],
    selector: 'app-category-edit',
    styleUrl: './category-edit.scss',
    templateUrl: './category-edit.html'
})
export class CategoryEdit {
    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService); // Inject the service
    categories = this.categoryService.categories;

    private flattenCategories(categories: CategoryOption[], indentation = ''): CategoryOption[] {
        return categories.flatMap((category) => [
            { ...category, name: `${indentation}${category.name}` },
            ...(category.children ? this.flattenCategories(category.children, `${indentation}   `) : [])
        ]);
    }

    // Manage UI error messages with a simple signal
    errorMessage = signal<string | null>(null);

    // Strongly-typed reactive form group definition
    categoryForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        parent_id: [''],
        slug: ['', [Validators.required, Validators.maxLength(255)]],
        order_index: [''],
        description: ['', [Validators.maxLength(1000)]],
        id: [0] // Default to 0 for new categories; will be ignored by the backend
    });

    readonly form = this.categoryForm;

    getCategoryListFlat(excludeId: string | number | null = null): CategoryOption[] {
        return this.flattenCategories(this.categories().filter((category) => category.id !== excludeId));
    }

    save() {
        if (this.categoryForm.valid) {
            this.errorMessage.set(null); // Clear previous errors
            console.log('Form is valid. Ready to submit:', this.categoryForm.value);
            // this.categoryService.createCategory(this.categoryForm.value).subscribe({
            //     next: (response) => {
            //         // Success callback
            //         console.log('Category created successful!', response);
            //         // close the dialog
            //         // this.dialog.close();
            //     },
            //     error: (err) => {
            //         // Error callback (handles 401, 500, network issues, etc.)
            //         console.error('Failed to create category', err);
            //         this.errorMessage.set(err.error?.errors?.join('<br/>') || 'Invalid email or password.');
            //     }
            // });
        }
    }
}
