import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteCategoryContent } from './delete-category-content';

describe('DeleteCategoryContent', () => {
    let component: DeleteCategoryContent;
    let fixture: ComponentFixture<DeleteCategoryContent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DeleteCategoryContent]
        }).compileComponents();

        fixture = TestBed.createComponent(DeleteCategoryContent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
