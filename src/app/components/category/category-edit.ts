import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryService } from '../../services/category';

@Component({
    imports: [],
    selector: 'app-category-edit',
    styleUrl: './category-edit.scss',
    templateUrl: './category-edit.html'
})
export class CategoryEdit {
    private fb = inject(FormBuilder);
    private categoryService = inject(CategoryService); // Inject the service

    // Manage UI error messages with a simple signal
    errorMessage = signal<string | null>(null);

    // Strongly-typed reactive form group definition
    categoryForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]]
    });

    onSubmit() {
        if (this.categoryForm.valid) {
            this.errorMessage.set(null); // Clear previous errors
            this.categoryService.save(this.categoryForm.value).subscribe({
                next: (response) => {
                    // Success callback
                    console.log('Login successful!', response);
                    this.router.navigate(['/dashboard']);
                },
                error: (err) => {
                    // Error callback (handles 401, 500, network issues, etc.)
                    console.error('Login failed', err);
                    this.errorMessage.set(err.error?.errors?.join('<br/>') || 'Invalid email or password.');
                }
            });
        }
    }
}
