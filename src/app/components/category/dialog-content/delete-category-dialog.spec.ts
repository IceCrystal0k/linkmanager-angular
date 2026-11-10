import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteCategoryDialog } from './delete-category-dialog';

describe('DeleteCategoryDialog', () => {
    let component: DeleteCategoryDialog;
    let fixture: ComponentFixture<DeleteCategoryDialog>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeleteCategoryDialog]
        }).compileComponents();

        fixture = TestBed.createComponent(DeleteCategoryDialog);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('requires a category when the selected action is move', () => {
        expect(component.form.valid).toBe(false);

        component.form.controls.category_id.setValue(1);

        expect(component.form.valid).toBe(true);
    });

    it('does not require a category when the selected action is delete', () => {
        component.form.controls.action.setValue('delete');

        expect(component.form.valid).toBe(true);
    });
});
