import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericDialog } from './generic-dialog';

describe('GenericDialog', () => {
    let component: GenericDialog;
    let fixture: ComponentFixture<GenericDialog>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GenericDialog]
        }).compileComponents();

        fixture = TestBed.createComponent(GenericDialog);
        component = fixture.componentInstance;
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
