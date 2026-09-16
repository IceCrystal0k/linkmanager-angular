import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditDialog } from './edit-dialog';

@Component({
    template: ''
})
class TestEditContent {
    save() {
        return 'saved';
    }
}

describe('EditDialog', () => {
    let component: EditDialog;
    let fixture: ComponentFixture<EditDialog>;
    let close: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        close = vi.fn();

        await TestBed.configureTestingModule({
            imports: [EditDialog],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: { data: { component: TestEditContent } } },
                { provide: MatDialogRef, useValue: { close } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EditDialog);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create with Save and Cancel defaults', () => {
        expect(component).toBeTruthy();
        expect(fixture.nativeElement.textContent).toContain('Save');
        expect(fixture.nativeElement.textContent).toContain('Cancel');
    });

    it('should return the edit content result when saved', () => {
        component.onSave();

        expect(close).toHaveBeenCalledWith('saved');
    });

    it('should return false when cancelled', () => {
        component.onCancel();

        expect(close).toHaveBeenCalledWith(false);
    });
});