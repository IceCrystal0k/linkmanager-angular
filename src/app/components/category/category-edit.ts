import { Component, inject, signal, input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CategoryService } from '../../services/category';

interface CategoryOption {
    name: string;
    id: string;
    module_id: string;
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
    moduleId = input<string | null>(null);
    categories = this.categoryService.categories;

    private flattenCategories(categories: CategoryOption[], excludeId: string | null, indentation = ''): CategoryOption[] {
        return categories.flatMap((category) => {
          if (category.id === excludeId) {
            return [];
          }
          return [
            { ...category, name: `${indentation}${category.name}` },
            ...(category.children ? this.flattenCategories(category.children, excludeId, `${indentation}   `) : [])
          ];
        });
    }

    // Manage UI error messages with a simple signal
    errorMessage = signal<string | null>(null);

    // Strongly-typed reactive form group definition
    categoryForm = this.fb.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(255)]],
        parent_id: [''],
        slug: ['', [Validators.required, Validators.maxLength(255)]],
        order_index: [0],
        description: ['', [Validators.maxLength(1000)]],
        module_id: [''],
        id: [''] // Default to 0 for new categories; will be ignored by the backend
    });

    readonly form = this.categoryForm;

    getCategoryListFlat(excludeId: string | null = null): CategoryOption[] {
        const moduleCategories = this.categories().filter((category) =>
            category.module_id === this.moduleId()
        );
        return this.flattenCategories(moduleCategories, excludeId);
    }

    save() {
        if (this.categoryForm.valid) {
            this.errorMessage.set(null); // Clear previous errors
            this.categoryForm.patchValue({ id: this.categoryForm.value.slug }); // Ensure id is set to 0 if not provided
            console.log('Form is valid. Ready to submit:', this.categoryForm.value);
            return this.categoryForm.value; // Return the form value for submission
        }
        return false; // Indicate that the form is invalid
    }
}
